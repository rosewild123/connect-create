
-- Explicitly grant column-level SELECT on safe profile columns to authenticated.
-- This is the column-level enforcement that the security memory describes; the
-- broad "Authenticated can read safe columns of active profiles" RLS policy
-- gates rows, while these column grants gate which columns are returned.
GRANT SELECT (id) ON public.profiles TO authenticated;
GRANT SELECT (display_name) ON public.profiles TO authenticated;
GRANT SELECT (bio) ON public.profiles TO authenticated;
GRANT SELECT (location_city) ON public.profiles TO authenticated;
GRANT SELECT (location_country) ON public.profiles TO authenticated;
GRANT SELECT (willing_to_travel) ON public.profiles TO authenticated;
GRANT SELECT (experience_years) ON public.profiles TO authenticated;
GRANT SELECT (completed_collabs) ON public.profiles TO authenticated;
GRANT SELECT (looking_for) ON public.profiles TO authenticated;
GRANT SELECT (niches) ON public.profiles TO authenticated;
GRANT SELECT (platforms) ON public.profiles TO authenticated;
GRANT SELECT (photos) ON public.profiles TO authenticated;
GRANT SELECT (is_onboarded) ON public.profiles TO authenticated;
GRANT SELECT (age_verified) ON public.profiles TO authenticated;
GRANT SELECT (photo_verified) ON public.profiles TO authenticated;
GRANT SELECT (photo_verified_at) ON public.profiles TO authenticated;
GRANT SELECT (prompts) ON public.profiles TO authenticated;
GRANT SELECT (last_active_at) ON public.profiles TO authenticated;
GRANT SELECT (created_at) ON public.profiles TO authenticated;
GRANT SELECT (updated_at) ON public.profiles TO authenticated;
GRANT SELECT (date_of_birth) ON public.profiles TO authenticated;
-- Explicitly NOT granted: plus_until, premium_until, referral_code,
-- is_ambassador, is_paused, id_verified. Owner reads them via the
-- "Owners can view own profile" policy + get_my_profile() SECURITY DEFINER.

-- Ensure view is still reachable
GRANT SELECT ON public.profiles_public TO authenticated;
