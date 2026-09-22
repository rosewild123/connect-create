-- Helper: determine a user's effective plan tier from paid subscriptions + grants
CREATE OR REPLACE FUNCTION public.effective_plan_tier(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _plus_until timestamptz;
  _premium_until timestamptz;
  _amb boolean;
  _price text;
BEGIN
  SELECT plus_until, premium_until, COALESCE(is_ambassador, false)
    INTO _plus_until, _premium_until, _amb
  FROM public.profiles WHERE id = _user_id;

  IF COALESCE(_amb, false) THEN RETURN 'premium'; END IF;
  IF _premium_until IS NOT NULL AND _premium_until > now() THEN RETURN 'premium'; END IF;

  -- Paid subscription (Stripe / CCBill): newest usable row wins
  SELECT price_id INTO _price
  FROM public.subscriptions
  WHERE user_id = _user_id
    AND status IN ('active', 'trialing', 'past_due', 'canceled')
    AND (current_period_end IS NULL OR current_period_end > now())
  ORDER BY created_at DESC
  LIMIT 1;

  IF _price IS NOT NULL AND _price ILIKE '%premium%' THEN RETURN 'premium'; END IF;
  IF _price IS NOT NULL THEN RETURN 'plus'; END IF;

  IF _plus_until IS NOT NULL AND _plus_until > now() THEN RETURN 'plus'; END IF;

  RETURN 'free';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.effective_plan_tier(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.effective_plan_tier(uuid) TO authenticated, service_role;

-- Boosts: recognise paid subscribers for the monthly included quota
CREATE OR REPLACE FUNCTION public.activate_boost(_duration_minutes integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _me uuid := auth.uid();
  _tier text;
  _is_premium boolean;
  _is_plus boolean;
  _quota int;
  _used int;
  _ends timestamptz;
  _credits int;
  _source text;
BEGIN
  IF _me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not signed in');
  END IF;

  IF _duration_minutes IS NULL OR _duration_minutes <= 0 OR _duration_minutes > 120 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid duration');
  END IF;

  _tier := public.effective_plan_tier(_me);
  _is_premium := (_tier = 'premium');
  _is_plus := (_tier IN ('plus', 'premium'));

  _quota := CASE WHEN _is_premium THEN 4 WHEN _is_plus THEN 1 ELSE 0 END;

  SELECT COUNT(*)::int INTO _used FROM public.boosts
    WHERE user_id = _me
      AND source IN ('plus_monthly', 'premium_monthly')
      AND created_at >= date_trunc('month', now());

  IF _is_plus AND _used < _quota THEN
    _source := CASE WHEN _is_premium THEN 'premium_monthly' ELSE 'plus_monthly' END;
  ELSE
    SELECT credits INTO _credits FROM public.boost_credits WHERE user_id = _me FOR UPDATE;
    IF COALESCE(_credits, 0) <= 0 THEN
      IF _is_plus THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Monthly boost quota reached');
      END IF;
      RETURN jsonb_build_object('ok', false, 'error', 'No boosts left — buy a boost pack or get Plus');
    END IF;
    UPDATE public.boost_credits SET credits = credits - 1 WHERE user_id = _me;
    _source := 'credit_pack';
  END IF;

  _ends := now() + (_duration_minutes || ' minutes')::interval;
  INSERT INTO public.boosts (user_id, ends_at, source)
    VALUES (_me, _ends, _source);

  RETURN jsonb_build_object('ok', true, 'ends_at', _ends, 'source', _source);
END;
$$;

-- Monthly quota reporting should match the same tiers
CREATE OR REPLACE FUNCTION public.boosts_this_month()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::int FROM public.boosts
  WHERE user_id = auth.uid()
    AND source IN ('plus_monthly', 'premium_monthly')
    AND created_at >= date_trunc('month', now());
$$;

-- Passport: allow paid subscribers too
CREATE OR REPLACE FUNCTION public.enforce_passport_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (NEW.passport_city IS DISTINCT FROM OLD.passport_city
      OR NEW.passport_country IS DISTINCT FROM OLD.passport_country)
     AND (COALESCE(NEW.passport_city, '') <> '' OR COALESCE(NEW.passport_country, '') <> '') THEN
    IF public.effective_plan_tier(NEW.id) NOT IN ('plus', 'premium') THEN
      RAISE EXCEPTION 'Passport requires Senda Plus or Premium';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_passport_plan() FROM PUBLIC, anon, authenticated;
