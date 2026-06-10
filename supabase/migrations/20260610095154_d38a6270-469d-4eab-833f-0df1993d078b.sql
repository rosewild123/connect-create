
CREATE POLICY "Authenticated can read profile photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
