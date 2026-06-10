
-- Allow super likes
ALTER TABLE public.swipes DROP CONSTRAINT IF EXISTS swipes_direction_check;
ALTER TABLE public.swipes ADD CONSTRAINT swipes_direction_check
  CHECK (direction = ANY (ARRAY['like'::text, 'pass'::text, 'super'::text]));

-- Update match trigger to count super as like
CREATE OR REPLACE FUNCTION public.handle_swipe_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  reciprocal_exists BOOLEAN;
  a UUID; b UUID;
BEGIN
  IF NEW.direction = 'pass' THEN RETURN NEW; END IF;
  SELECT EXISTS(
    SELECT 1 FROM public.swipes
    WHERE swiper_id = NEW.swipee_id AND swipee_id = NEW.swiper_id
      AND direction IN ('like', 'super')
  ) INTO reciprocal_exists;
  IF reciprocal_exists THEN
    a := LEAST(NEW.swiper_id, NEW.swipee_id);
    b := GREATEST(NEW.swiper_id, NEW.swipee_id);
    INSERT INTO public.matches (user_a, user_b) VALUES (a, b)
    ON CONFLICT (user_a, user_b) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

-- BOOSTS
CREATE TABLE public.boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL DEFAULT 'plus_monthly',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.boosts TO authenticated;
GRANT ALL ON public.boosts TO service_role;
ALTER TABLE public.boosts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own boosts" ON public.boosts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "users create own boosts" ON public.boosts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX boosts_active_idx ON public.boosts(user_id, ends_at);

-- Helpers
CREATE OR REPLACE FUNCTION public.super_likes_today()
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.swipes
  WHERE swiper_id = auth.uid()
    AND direction = 'super'
    AND created_at >= date_trunc('day', now());
$$;
GRANT EXECUTE ON FUNCTION public.super_likes_today() TO authenticated;

CREATE OR REPLACE FUNCTION public.active_boost_ends_at(_user_id uuid)
RETURNS timestamptz
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT MAX(ends_at) FROM public.boosts
  WHERE user_id = _user_id AND ends_at > now();
$$;
GRANT EXECUTE ON FUNCTION public.active_boost_ends_at(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.boosts_this_month()
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM public.boosts
  WHERE user_id = auth.uid()
    AND created_at >= date_trunc('month', now());
$$;
GRANT EXECUTE ON FUNCTION public.boosts_this_month() TO authenticated;

-- List of currently-boosted user ids (for Discover priority)
CREATE OR REPLACE FUNCTION public.boosted_user_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT user_id FROM public.boosts WHERE ends_at > now();
$$;
GRANT EXECUTE ON FUNCTION public.boosted_user_ids() TO authenticated;
