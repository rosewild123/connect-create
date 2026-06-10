CREATE TABLE public.match_reads (
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (match_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_reads TO authenticated;
GRANT ALL ON public.match_reads TO service_role;
ALTER TABLE public.match_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read receipts" ON public.match_reads FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND (m.user_a = auth.uid() OR m.user_b = auth.uid())));
CREATE POLICY "Members insert own receipt" ON public.match_reads FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND (m.user_a = auth.uid() OR m.user_b = auth.uid())));
CREATE POLICY "Members update own receipt" ON public.match_reads FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_reads;