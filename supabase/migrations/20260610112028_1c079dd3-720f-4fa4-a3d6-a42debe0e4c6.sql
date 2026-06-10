
CREATE OR REPLACE FUNCTION public.get_hidden_user_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT blocked_id FROM public.blocks WHERE blocker_id = auth.uid()
  UNION
  SELECT blocker_id FROM public.blocks WHERE blocked_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_hidden_user_ids() TO authenticated;
