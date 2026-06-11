
-- 1. PROFILES
DROP POLICY IF EXISTS "Authenticated can view onboarded profiles" ON public.profiles;

CREATE POLICY "Owners can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "Authenticated can view active onboarded profiles"
ON public.profiles FOR SELECT TO authenticated
USING (is_onboarded = true AND is_paused = false AND id <> auth.uid());

DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = true) AS
SELECT
  id, display_name, bio, location_city, location_country, willing_to_travel,
  experience_years, completed_collabs, looking_for, niches, platforms, photos,
  is_onboarded, id_verified, age_verified, photo_verified, photo_verified_at,
  prompts, last_active_at, created_at,
  CASE WHEN date_of_birth IS NULL THEN NULL
       ELSE date_part('year', age(date_of_birth))::int END AS age
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS public.profiles
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_profile() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- 2. STORAGE
DROP POLICY IF EXISTS "Authenticated can read profile photos" ON storage.objects;

CREATE POLICY "Read profile photos for active onboarded users"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.is_onboarded = true
        AND p.is_paused = false
    )
  )
);

-- 3. USER_ROLES
DROP POLICY IF EXISTS "Admins insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins delete roles" ON public.user_roles;

CREATE POLICY "Admins insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. PROMO_REDEMPTIONS: restrictive deny on direct writes (use SECURITY DEFINER fn instead)
DROP POLICY IF EXISTS "No direct writes to promo redemptions" ON public.promo_redemptions;
CREATE POLICY "No direct writes to promo redemptions"
ON public.promo_redemptions AS RESTRICTIVE
FOR ALL TO authenticated
USING (false)
WITH CHECK (false);

-- 5. Fix gen_referral_code search_path (use schema-qualified gen_random_bytes from pgcrypto)
CREATE OR REPLACE FUNCTION public.gen_referral_code()
RETURNS text
LANGUAGE sql
SET search_path = public, extensions
AS $$
  SELECT upper(substr(replace(encode(extensions.gen_random_bytes(6), 'base64'), '/', ''), 1, 8));
$$;

-- 6. Revoke EXECUTE from anon on SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.active_boost_ends_at(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.boosts_this_month() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.boosted_user_ids() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.super_likes_today() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_hidden_user_ids() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.claim_referral(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.redeem_promo_code(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.active_boost_ends_at(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.boosts_this_month() TO authenticated;
GRANT EXECUTE ON FUNCTION public.boosted_user_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.super_likes_today() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_hidden_user_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_referral(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_promo_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO authenticated;
