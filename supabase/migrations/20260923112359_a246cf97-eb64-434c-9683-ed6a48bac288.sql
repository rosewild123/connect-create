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

  -- Paid subscription: only genuinely usable rows count.
  -- Cancelled/expired rows only count while a known paid period is still running.
  SELECT price_id INTO _price
  FROM public.subscriptions
  WHERE user_id = _user_id
    AND (
      (status IN ('active', 'trialing', 'past_due'))
      OR (status = 'canceled' AND current_period_end IS NOT NULL AND current_period_end > now())
    )
  ORDER BY created_at DESC
  LIMIT 1;

  IF _price IS NOT NULL AND _price ILIKE '%premium%' THEN RETURN 'premium'; END IF;
  IF _price IS NOT NULL THEN RETURN 'plus'; END IF;

  IF _plus_until IS NOT NULL AND _plus_until > now() THEN RETURN 'plus'; END IF;

  RETURN 'free';
END;
$$;

ALTER FUNCTION public.effective_plan_tier(uuid) OWNER TO postgres;
REVOKE EXECUTE ON FUNCTION public.effective_plan_tier(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.effective_plan_tier(uuid) TO anon, authenticated, service_role, postgres;
