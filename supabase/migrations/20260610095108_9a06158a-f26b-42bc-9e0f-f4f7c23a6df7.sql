
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  date_of_birth DATE,
  location_city TEXT,
  location_country TEXT,
  willing_to_travel BOOLEAN NOT NULL DEFAULT false,
  experience_years INT,
  completed_collabs INT NOT NULL DEFAULT 0,
  looking_for TEXT[] NOT NULL DEFAULT '{}',
  niches TEXT[] NOT NULL DEFAULT '{}',
  platforms JSONB NOT NULL DEFAULT '[]'::jsonb,
  photos TEXT[] NOT NULL DEFAULT '{}',
  is_onboarded BOOLEAN NOT NULL DEFAULT false,
  age_verified BOOLEAN NOT NULL DEFAULT false,
  id_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Any authenticated user can read profiles (for discovery)
CREATE POLICY "Authenticated can view onboarded profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (is_onboarded = true OR id = auth.uid());
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Updated at
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Swipes
CREATE TABLE public.swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  swipee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('like','pass')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (swiper_id, swipee_id),
  CHECK (swiper_id <> swipee_id)
);
GRANT SELECT, INSERT, DELETE ON public.swipes TO authenticated;
GRANT ALL ON public.swipes TO service_role;
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own swipes" ON public.swipes FOR SELECT TO authenticated USING (swiper_id = auth.uid());
CREATE POLICY "Users insert own swipes" ON public.swipes FOR INSERT TO authenticated WITH CHECK (swiper_id = auth.uid());
CREATE INDEX swipes_swiper_idx ON public.swipes(swiper_id);
CREATE INDEX swipes_swipee_idx ON public.swipes(swipee_id);

-- Matches
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_a, user_b),
  CHECK (user_a < user_b)
);
GRANT SELECT ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view their matches" ON public.matches FOR SELECT TO authenticated
  USING (user_a = auth.uid() OR user_b = auth.uid());

-- Auto-create match on mutual like
CREATE OR REPLACE FUNCTION public.handle_swipe_match() RETURNS TRIGGER AS $$
DECLARE
  reciprocal_exists BOOLEAN;
  a UUID; b UUID;
BEGIN
  IF NEW.direction <> 'like' THEN RETURN NEW; END IF;
  SELECT EXISTS(
    SELECT 1 FROM public.swipes
    WHERE swiper_id = NEW.swipee_id AND swipee_id = NEW.swiper_id AND direction = 'like'
  ) INTO reciprocal_exists;
  IF reciprocal_exists THEN
    a := LEAST(NEW.swiper_id, NEW.swipee_id);
    b := GREATEST(NEW.swiper_id, NEW.swipee_id);
    INSERT INTO public.matches (user_a, user_b) VALUES (a, b)
    ON CONFLICT (user_a, user_b) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_swipe_check_match
  AFTER INSERT ON public.swipes
  FOR EACH ROW EXECUTE FUNCTION public.handle_swipe_match();

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Match members can view messages" ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND (m.user_a = auth.uid() OR m.user_b = auth.uid())));
CREATE POLICY "Match members can send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id AND (m.user_a = auth.uid() OR m.user_b = auth.uid())));
CREATE INDEX messages_match_idx ON public.messages(match_id, created_at);

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
