
-- Recreate view with security_invoker (caller permissions)
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = true)
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

-- Reinstate cross-user read policy (column access is restricted via REVOKE below)
CREATE POLICY "Authenticated can view active onboarded profiles"
ON public.profiles FOR SELECT TO authenticated
USING (is_onboarded = true AND is_paused = false);

-- Revoke SELECT on sensitive columns so direct .from('profiles').select(...)
-- cannot expose them. Owners must use get_my_profile() RPC.
REVOKE SELECT (date_of_birth, plus_until, premium_until, referral_code, is_paused, is_ambassador)
  ON public.profiles FROM authenticated, anon;

-- Admin profile search (used by the Ambassadors admin page)
CREATE OR REPLACE FUNCTION public.admin_search_profiles(_query text)
RETURNS TABLE(id uuid, display_name text, is_ambassador boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admins only';
  END IF;
  RETURN QUERY
  SELECT p.id, p.display_name, p.is_ambassador
  FROM public.profiles p
  WHERE p.display_name ILIKE '%' || _query || '%'
  ORDER BY p.display_name
  LIMIT 20;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_search_profiles(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_search_profiles(text) TO authenticated;
