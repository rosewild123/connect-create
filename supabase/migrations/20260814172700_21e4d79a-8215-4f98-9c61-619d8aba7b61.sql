CREATE TABLE public.verification_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  session_id text not null,
  session_url text,
  status text not null default 'created',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, session_id)
);

CREATE INDEX idx_verification_sessions_user ON public.verification_sessions(user_id, provider, status);

GRANT SELECT ON public.verification_sessions TO authenticated;
GRANT ALL ON public.verification_sessions TO service_role;

ALTER TABLE public.verification_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verification sessions"
  ON public.verification_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);