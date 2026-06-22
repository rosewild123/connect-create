DROP VIEW IF EXISTS public.profiles_public;

CREATE OR REPLACE FUNCTION public.get_public_profiles()
RETURNS TABLE (
  id uuid,
  display_name text,
  bio text,
  location_city text,
  location_country text,
  willing_to_travel boolean,
  experience_years integer,
  completed_collabs integer,
  looking_for text[],
  niches text[],
  platforms jsonb,
  photos text[],
  is_onboarded boolean,
  age_verified boolean,
  photo_verified boolean,
  photo_verified_at timestamptz,
  prompts jsonb,
  last_active_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  age integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.display_name,
    p.bio,
    p.location_city,
    p.location_country,
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

REVOKE ALL ON FUNCTION public.get_public_profiles() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_profiles() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_public_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profiles() TO service_role;

CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT * FROM public.get_public_profiles();

REVOKE ALL ON public.profiles_public FROM anon;
GRANT SELECT ON public.profiles_public TO authenticated;
GRANT ALL ON public.profiles_public TO service_role;

REVOKE SELECT (date_of_birth, id_verified, referral_code, plus_until, premium_until, is_paused, is_ambassador) ON public.profiles FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;