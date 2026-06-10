
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS photo_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS photo_verified_at timestamptz;

CREATE TABLE IF NOT EXISTS public.photo_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pose text NOT NULL,
  selfie_path text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending','passed','failed')),
  ai_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.photo_verifications TO authenticated;
GRANT ALL ON public.photo_verifications TO service_role;
ALTER TABLE public.photo_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own attempts read" ON public.photo_verifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own attempts insert" ON public.photo_verifications
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "verif read own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'verifications' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "verif write own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'verifications' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "verif update own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'verifications' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "verif delete own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'verifications' AND (storage.foldername(name))[1] = auth.uid()::text);
