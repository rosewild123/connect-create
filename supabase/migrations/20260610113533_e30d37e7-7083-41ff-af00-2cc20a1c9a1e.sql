
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS media_path text,
  ADD COLUMN IF NOT EXISTS media_type text CHECK (media_type IN ('image','audio')),
  ADD COLUMN IF NOT EXISTS duration_ms integer;

ALTER TABLE public.messages ALTER COLUMN content DROP NOT NULL;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_content_or_media CHECK (
    (content IS NOT NULL AND length(content) > 0) OR media_path IS NOT NULL
  );

-- Storage policies: path is `${match_id}/${user_id}/${filename}`
CREATE POLICY "chat media read for match participants" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'chat-media' AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id::text = (storage.foldername(name))[1]
        AND auth.uid() IN (m.user_a, m.user_b)
    )
  );

CREATE POLICY "chat media write own folder in own match" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id::text = (storage.foldername(name))[1]
        AND auth.uid() IN (m.user_a, m.user_b)
    )
  );

CREATE POLICY "chat media delete own" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'chat-media' AND (storage.foldername(name))[2] = auth.uid()::text
  );
