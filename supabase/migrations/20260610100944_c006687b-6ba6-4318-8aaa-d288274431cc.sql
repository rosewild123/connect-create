
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  status text NOT NULL,
  price_id text,
  product_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX subscriptions_user_env_idx ON public.subscriptions (user_id, environment, created_at DESC);
CREATE INDEX subscriptions_customer_idx ON public.subscriptions (stripe_customer_id);

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription" ON public.subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Security-definer helper used by app code to safely gate premium features
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid, _environment text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND environment = _environment
      AND status IN ('active','trialing','past_due')
      AND (current_period_end IS NULL OR current_period_end > now())
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO authenticated;
