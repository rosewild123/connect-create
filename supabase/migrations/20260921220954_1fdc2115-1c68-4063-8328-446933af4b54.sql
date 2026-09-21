CREATE TABLE public.boost_credits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.boost_credits TO authenticated;
GRANT ALL ON public.boost_credits TO service_role;

ALTER TABLE public.boost_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own boost credits"
  ON public.boost_credits FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER boost_credits_updated_at
  BEFORE UPDATE ON public.boost_credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.grant_boost_credits(_user_id uuid, _credits integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _total integer;
BEGIN
  IF _credits IS NULL OR _credits <= 0 OR _credits > 100 THEN
    RAISE EXCEPTION 'Invalid credit amount';
  END IF;

  INSERT INTO public.boost_credits (user_id, credits)
  VALUES (_user_id, _credits)
  ON CONFLICT (user_id) DO UPDATE
    SET credits = public.boost_credits.credits + EXCLUDED.credits
  RETURNING credits INTO _total;

  RETURN _total;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.grant_boost_credits(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.grant_boost_credits(uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.grant_boost_credits(uuid, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.grant_boost_credits(uuid, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.my_boost_credits()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE((SELECT credits FROM public.boost_credits WHERE user_id = auth.uid()), 0);
$$;

CREATE OR REPLACE FUNCTION public.activate_boost(_duration_minutes integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _me uuid := auth.uid();
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

  SELECT
    (premium_until IS NOT NULL AND premium_until > now()) OR is_ambassador,
    (plus_until IS NOT NULL AND plus_until > now())
       OR (premium_until IS NOT NULL AND premium_until > now())
       OR is_ambassador
  INTO _is_premium, _is_plus
  FROM public.profiles WHERE id = _me;

  _quota := CASE WHEN _is_premium THEN 4 WHEN _is_plus THEN 1 ELSE 0 END;

  SELECT COUNT(*)::int INTO _used FROM public.boosts
    WHERE user_id = _me
      AND source IN ('plus_monthly', 'premium_monthly')
      AND created_at >= date_trunc('month', now());

  IF COALESCE(_is_plus, false) AND _used < _quota THEN
    _source := CASE WHEN _is_premium THEN 'premium_monthly' ELSE 'plus_monthly' END;
  ELSE
    SELECT credits INTO _credits FROM public.boost_credits WHERE user_id = _me FOR UPDATE;
    IF COALESCE(_credits, 0) <= 0 THEN
      IF COALESCE(_is_plus, false) THEN
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

CREATE OR REPLACE FUNCTION public.boosts_this_month()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::int FROM public.boosts
  WHERE user_id = auth.uid()
    AND source IN ('plus_monthly', 'premium_monthly')
    AND created_at >= date_trunc('month', now());
$$;

ALTER TABLE public.profiles
  ADD COLUMN passport_city text,
  ADD COLUMN passport_country text;

CREATE OR REPLACE FUNCTION public.enforce_passport_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _is_plus boolean;
BEGIN
  IF (NEW.passport_city IS DISTINCT FROM OLD.passport_city
      OR NEW.passport_country IS DISTINCT FROM OLD.passport_country)
     AND (COALESCE(NEW.passport_city, '') <> '' OR COALESCE(NEW.passport_country, '') <> '') THEN
    _is_plus := (NEW.plus_until IS NOT NULL AND NEW.plus_until > now())
      OR (NEW.premium_until IS NOT NULL AND NEW.premium_until > now())
      OR COALESCE(NEW.is_ambassador, false);
    IF NOT _is_plus THEN
      RAISE EXCEPTION 'Passport requires Senda Plus or Premium';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_enforce_passport_plan
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_passport_plan();

CREATE OR REPLACE FUNCTION public.get_public_profiles()
RETURNS TABLE(id uuid, display_name text, bio text, location_city text, location_country text, willing_to_travel boolean, experience_years integer, completed_collabs integer, looking_for text[], niches text[], platforms jsonb, photos text[], is_onboarded boolean, age_verified boolean, photo_verified boolean, photo_verified_at timestamp with time zone, prompts jsonb, last_active_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone, age integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p.id,
    p.display_name,
    p.bio,
    COALESCE(NULLIF(p.passport_city, ''), p.location_city) AS location_city,
    COALESCE(NULLIF(p.passport_country, ''), p.location_country) AS location_country,
    p.willing_to_travel,
    p.experience_years,
    p.completed_collabs,
    p.looking_for,
    p.niches,
    p.platforms,
    p.photos,
    p.is_onboarded,
    p.age_verified,
    p.photo_verified,
    p.photo_verified_at,
    p.prompts,
    p.last_active_at,
    p.created_at,
    p.updated_at,
    CASE
      WHEN p.date_of_birth IS NULL THEN NULL::integer
      ELSE date_part('year', age(p.date_of_birth::timestamptz))::integer
    END AS age
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND p.is_onboarded = true
    AND p.is_paused = false;
$$;