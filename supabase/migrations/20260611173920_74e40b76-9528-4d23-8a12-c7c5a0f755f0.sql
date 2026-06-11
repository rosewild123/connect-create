-- Add premium_until column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_until timestamptz;

-- Promo codes table
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  tier text NOT NULL CHECK (tier IN ('plus','premium')),
  duration_days int NOT NULL CHECK (duration_days > 0),
  max_uses int NOT NULL DEFAULT 1 CHECK (max_uses > 0),
  uses int NOT NULL DEFAULT 0,
  expires_at timestamptz,
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_codes TO authenticated;
GRANT ALL ON public.promo_codes TO service_role;

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all promo codes"
  ON public.promo_codes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert promo codes"
  ON public.promo_codes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update promo codes"
  ON public.promo_codes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete promo codes"
  ON public.promo_codes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Redemptions table (audit + prevent double-redeem per user)
CREATE TABLE public.promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL,
  duration_days int NOT NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (code_id, user_id)
);

GRANT SELECT, INSERT ON public.promo_redemptions TO authenticated;
GRANT ALL ON public.promo_redemptions TO service_role;

ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own redemptions"
  ON public.promo_redemptions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Redeem function: validates code, marks used, grants tier
CREATE OR REPLACE FUNCTION public.redeem_promo_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me uuid := auth.uid();
  _row public.promo_codes%ROWTYPE;
BEGIN
  IF _me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not signed in');
  END IF;

  SELECT * INTO _row FROM public.promo_codes
    WHERE code = upper(trim(_code)) FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid code');
  END IF;

  IF _row.expires_at IS NOT NULL AND _row.expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This code has expired');
  END IF;

  IF _row.uses >= _row.max_uses THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This code has already been used');
  END IF;

  IF EXISTS (SELECT 1 FROM public.promo_redemptions WHERE code_id = _row.id AND user_id = _me) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'You have already redeemed this code');
  END IF;

  INSERT INTO public.promo_redemptions (code_id, user_id, tier, duration_days)
    VALUES (_row.id, _me, _row.tier, _row.duration_days);

  UPDATE public.promo_codes SET uses = uses + 1 WHERE id = _row.id;

  IF _row.tier = 'premium' THEN
    UPDATE public.profiles
      SET premium_until = GREATEST(COALESCE(premium_until, now()), now()) + (_row.duration_days || ' days')::interval
      WHERE id = _me;
  ELSE
    UPDATE public.profiles
      SET plus_until = GREATEST(COALESCE(plus_until, now()), now()) + (_row.duration_days || ' days')::interval
      WHERE id = _me;
  END IF;

  RETURN jsonb_build_object('ok', true, 'tier', _row.tier, 'days', _row.duration_days);
END;
$$;