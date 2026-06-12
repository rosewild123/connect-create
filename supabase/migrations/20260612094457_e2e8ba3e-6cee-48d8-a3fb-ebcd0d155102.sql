
-- Drop overly broad policy that allowed any authenticated user to SELECT all profile columns.
-- Cross-user profile reads must go through the safe `profiles_public` view.
DROP POLICY IF EXISTS "Authenticated can view active onboarded profiles" ON public.profiles;

-- Ensure the safe view is reachable by signed-in users and exposes only non-sensitive columns.
GRANT SELECT ON public.profiles_public TO authenticated;

-- Make the view run with the caller's privileges so RLS applies on the underlying table for the view owner check path.
ALTER VIEW public.profiles_public SET (security_invoker = true);

-- The view still needs SELECT on the safe columns of profiles for the authenticated role.
GRANT SELECT (
  id, display_name, bio, location_city, location_country, willing_to_travel,
  experience_years, completed_collabs, looking_for, niches, platforms, photos,
  is_onboarded, id_verified, age_verified, photo_verified, photo_verified_at,
  prompts, last_active_at, created_at, date_of_birth
) ON public.profiles TO authenticated;

-- Add an RLS policy that lets authenticated users read rows of active onboarded profiles
-- ONLY for the safe columns above (column privileges enforce the restriction).
CREATE POLICY "Authenticated can read safe columns of active profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_onboarded = true AND is_paused = false);
