
-- 1) Drop broad cross-user read policy on profiles
DROP POLICY IF EXISTS "Authenticated can view active onboarded profiles" ON public.profiles;

-- 2) Recreate profiles_public as SECURITY DEFINER (bypasses RLS) so cross-user discovery works
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = false)
AS
SELECT
  id, display_name, bio, location_city, location_country, willing_to_travel,
  experience_years, completed_collabs, looking_for, niches, platforms, photos,
  is_onboarded, id_verified, age_verified, photo_verified, photo_verified_at,
  prompts, last_active_at, created_at,
  CASE WHEN date_of_birth IS NULL THEN NULL
       ELSE (date_part('year', age(date_of_birth::timestamptz)))::int END AS age
FROM public.profiles
WHERE is_onboarded = true AND is_paused = false;

GRANT SELECT ON public.profiles_public TO authenticated;

-- 3) Boost entitlement: server-side activation function
CREATE OR REPLACE FUNCTION public.activate_boost(_duration_minutes int DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid := auth.uid();
  _is_premium boolean;
  _is_plus boolean;
  _quota int;
  _used int;
  _ends timestamptz;
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

  IF NOT COALESCE(_is_plus, false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Boosts require Plus or Premium');
  END IF;

  _quota := CASE WHEN _is_premium THEN 4 ELSE 1 END;

  SELECT COUNT(*)::int INTO _used FROM public.boosts
    WHERE user_id = _me AND created_at >= date_trunc('month', now());

  IF _used >= _quota THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Monthly boost quota reached');
  END IF;

  _ends := now() + (_duration_minutes || ' minutes')::interval;
  INSERT INTO public.boosts (user_id, ends_at, source)
    VALUES (_me, _ends, CASE WHEN _is_premium THEN 'premium_monthly' ELSE 'plus_monthly' END);

  RETURN jsonb_build_object('ok', true, 'ends_at', _ends);
END;
$$;

REVOKE ALL ON FUNCTION public.activate_boost(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activate_boost(int) TO authenticated;

-- 4) Drop direct INSERT policy on boosts; users go through activate_boost()
DROP POLICY IF EXISTS "users create own boosts" ON public.boosts;

-- 5) Lock down SECURITY DEFINER functions: revoke from anon/public, grant to authenticated only
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
      AND p.proname IN (
        'has_role','claim_referral','redeem_promo_code','set_ambassador',
        'list_ambassadors','get_my_profile','has_active_subscription',
        'boosts_this_month','boosted_user_ids','active_boost_ends_at',
        'super_likes_today','get_hidden_user_ids','activate_boost'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC, anon', r.nspname, r.proname, r.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated', r.nspname, r.proname, r.args);
  END LOOP;
END $$;
