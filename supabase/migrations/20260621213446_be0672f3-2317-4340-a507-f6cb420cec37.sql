
-- Switch profiles_public to security_definer (runs as view owner, bypasses RLS),
-- so authenticated users can read safe columns of other onboarded profiles
-- without re-opening direct SELECT on public.profiles.
ALTER VIEW public.profiles_public SET (security_invoker = false);

-- Ensure the view is reachable through the Data API.
GRANT SELECT ON public.profiles_public TO authenticated;
