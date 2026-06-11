
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_ambassador boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.set_ambassador(_user_id uuid, _is boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Admins only');
  END IF;
  UPDATE public.profiles SET is_ambassador = _is WHERE id = _user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'User not found');
  END IF;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.list_ambassadors()
RETURNS TABLE(id uuid, display_name text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admins only';
  END IF;
  RETURN QUERY
  SELECT p.id, p.display_name, p.created_at
  FROM public.profiles p
  WHERE p.is_ambassador = true
  ORDER BY p.display_name;
END;
$$;
