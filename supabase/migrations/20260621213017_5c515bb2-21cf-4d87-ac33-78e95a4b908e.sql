
-- 1) Profiles: drop cross-user read policy. Cross-user reads must use profiles_public view.
DROP POLICY IF EXISTS "Authenticated can read safe columns of active profiles" ON public.profiles;

-- 2) Chat media: explicit UPDATE policy restricting to owner within own match folder.
--    Folder layout: {match_id}/{user_id}/...
DROP POLICY IF EXISTS "chat media update own" ON storage.objects;
CREATE POLICY "chat media update own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'chat-media'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id::text = (storage.foldername(name))[1]
      AND (m.user_a = auth.uid() OR m.user_b = auth.uid())
  )
)
WITH CHECK (
  bucket_id = 'chat-media'
  AND (storage.foldername(name))[2] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id::text = (storage.foldername(name))[1]
      AND (m.user_a = auth.uid() OR m.user_b = auth.uid())
  )
);

-- 3) Realtime: restrict subscriptions on realtime.messages so users can only
--    listen on topics for matches they participate in. The Supabase client uses
--    postgres_changes filters; the realtime.messages table governs which
--    presence/broadcast/postgres_changes events a subscriber receives.
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read own match realtime" ON realtime.messages;
CREATE POLICY "Authenticated can read own match realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Allow chat-channel topics like "messages:<match_id>" / "match:<match_id>" / a bare match uuid
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE (m.user_a = auth.uid() OR m.user_b = auth.uid())
      AND (
        realtime.topic() = m.id::text
        OR realtime.topic() LIKE '%' || m.id::text || '%'
      )
  )
  -- Or a per-user topic scoped to the current user (e.g. "user:<auth.uid()>")
  OR realtime.topic() LIKE '%' || auth.uid()::text || '%'
);

-- 4) Tighten EXECUTE on SECURITY DEFINER functions: revoke from anon/public.
REVOKE EXECUTE ON FUNCTION public.admin_messaging_stats(int) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.activate_boost(int) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.active_boost_ends_at(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_search_profiles(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.boosted_user_ids() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.boosts_this_month() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_referral(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_hidden_user_ids() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_profile() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.list_ambassadors() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.redeem_promo_code(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_ambassador(uuid, boolean) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.super_likes_today() FROM anon, PUBLIC;
