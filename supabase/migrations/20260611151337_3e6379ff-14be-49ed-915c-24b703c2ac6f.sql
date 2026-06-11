
-- 1. Add referral_code and plus_until to profiles
ALTER TABLE public.profiles
  ADD COLUMN referral_code text UNIQUE,
  ADD COLUMN plus_until timestamptz;

-- Generate codes for existing profiles
CREATE OR REPLACE FUNCTION public.gen_referral_code()
RETURNS text LANGUAGE sql VOLATILE AS $$
  SELECT upper(substr(replace(encode(gen_random_bytes(6), 'base64'), '/', ''), 1, 8));
$$;

UPDATE public.profiles SET referral_code = public.gen_referral_code() WHERE referral_code IS NULL;

-- Update handle_new_user to also generate referral_code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    public.gen_referral_code()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. referrals table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  reward_days int NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (referrer_id <> referred_user_id)
);

CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);

GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (referrer_id = auth.uid() OR referred_user_id = auth.uid());

-- 3. claim_referral function: grants reward to both sides, idempotent
CREATE OR REPLACE FUNCTION public.claim_referral(_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _me uuid := auth.uid();
  _referrer uuid;
  _days int := 30;
BEGIN
  IF _me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not signed in');
  END IF;

  SELECT id INTO _referrer FROM public.profiles
    WHERE referral_code = upper(trim(_code));

  IF _referrer IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid code');
  END IF;

  IF _referrer = _me THEN
    RETURN jsonb_build_object('ok', false, 'error', 'You cannot refer yourself');
  END IF;

  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_user_id = _me) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Referral already claimed');
  END IF;

  INSERT INTO public.referrals (referrer_id, referred_user_id, code, reward_days)
  VALUES (_referrer, _me, upper(trim(_code)), _days);

  -- Grant 30 days Plus to referrer (stack)
  UPDATE public.profiles
    SET plus_until = GREATEST(COALESCE(plus_until, now()), now()) + (_days || ' days')::interval
    WHERE id = _referrer;

  -- Grant 30 days Plus to referred user
  UPDATE public.profiles
    SET plus_until = GREATEST(COALESCE(plus_until, now()), now()) + (_days || ' days')::interval
    WHERE id = _me;

  RETURN jsonb_build_object('ok', true, 'reward_days', _days);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_referral(text) FROM public;
GRANT EXECUTE ON FUNCTION public.claim_referral(text) TO authenticated;
