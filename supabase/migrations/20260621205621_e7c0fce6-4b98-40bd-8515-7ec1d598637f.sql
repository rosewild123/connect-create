
-- 1) Remove sensitive column SELECT for cross-user reads.
--    Owners read these via the SECURITY DEFINER function public.get_my_profile().
REVOKE SELECT (plus_until, premium_until, referral_code, is_paused, is_ambassador)
  ON public.profiles FROM authenticated;
REVOKE SELECT (plus_until, premium_until, referral_code, is_paused, is_ambassador)
  ON public.profiles FROM anon;

-- 2) Lock anon out of profiles and swipes entirely (defense in depth).
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.swipes   FROM anon;

-- 3) Restrict the "users see swipes on them" policy to likes/super-likes only,
--    so passes are not enumerable by the rejected user.
DROP POLICY IF EXISTS "Users view swipes on them" ON public.swipes;
CREATE POLICY "Users view likes on them"
  ON public.swipes
  FOR SELECT
  TO authenticated
  USING (swipee_id = auth.uid() AND direction IN ('like','super'));
