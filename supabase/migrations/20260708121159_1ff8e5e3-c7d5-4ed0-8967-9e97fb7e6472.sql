CREATE OR REPLACE FUNCTION public.can_view_profile_photo(_owner_id text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _viewer uuid := auth.uid();
  _owner uuid;
BEGIN
  IF _viewer IS NULL OR _owner_id IS NULL OR _owner_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN false;
  END IF;

  _owner := _owner_id::uuid;

  IF _owner = _viewer THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = _owner
      AND p.is_onboarded = true
      AND p.is_paused = false
  );
END;
$$;

DROP POLICY IF EXISTS "Read profile photos for active onboarded users" ON storage.objects;

CREATE POLICY "Read profile photos for active onboarded users"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND public.can_view_profile_photo((storage.foldername(name))[1])
);