
-- Revert view to security_invoker
ALTER VIEW public.profiles_public SET (security_invoker = true);

-- Re-add a cross-user read policy on profiles for active onboarded users.
-- Column-level grants below prevent sensitive fields from leaking.
DROP POLICY IF EXISTS "Authenticated can read safe columns of active profiles" ON public.profiles;
CREATE POLICY "Authenticated can read safe columns of active profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_onboarded = true AND is_paused = false);

-- Lock down sensitive columns at the column-grant level.
-- The "Owners can view own profile" policy + get_my_profile() SECURITY DEFINER
-- still let users read their OWN sensitive fields.
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (
  id,
  display_name,
  bio,
  location_city,
  location_country,
  willing_to_travel,
  experience_years,
  completed_collabs,
  looking_for,
  niches,
  platforms,
  photos,
  is_onboarded,
  age_verified,
  photo_verified,
  photo_verified_at,
  prompts,
  last_active_at,
  created_at,
  updated_at,
  date_of_birth
) ON public.profiles TO authenticated;

-- Ensure view is reachable through Data API.
GRANT SELECT ON public.profiles_public TO authenticated;
