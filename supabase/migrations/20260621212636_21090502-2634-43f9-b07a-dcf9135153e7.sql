
CREATE OR REPLACE FUNCTION public.admin_messaging_stats(_days int DEFAULT 14)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result jsonb;
  _totals jsonb;
  _daily jsonb;
  _top jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admins only';
  END IF;

  IF _days IS NULL OR _days < 1 OR _days > 90 THEN
    _days := 14;
  END IF;

  SELECT jsonb_build_object(
    'total_matches', (SELECT count(*) FROM public.matches),
    'matches_with_messages', (SELECT count(DISTINCT match_id) FROM public.messages),
    'silent_matches', (SELECT count(*) FROM public.matches m WHERE NOT EXISTS (SELECT 1 FROM public.messages msg WHERE msg.match_id = m.id)),
    'total_messages', (SELECT count(*) FROM public.messages),
    'messages_last_24h', (SELECT count(*) FROM public.messages WHERE created_at > now() - interval '24 hours'),
    'messages_last_7d', (SELECT count(*) FROM public.messages WHERE created_at > now() - interval '7 days'),
    'active_senders_7d', (SELECT count(DISTINCT sender_id) FROM public.messages WHERE created_at > now() - interval '7 days'),
    'active_conversations_7d', (SELECT count(DISTINCT match_id) FROM public.messages WHERE created_at > now() - interval '7 days')
  ) INTO _totals;

  SELECT jsonb_agg(jsonb_build_object('day', day, 'messages', n, 'senders', s) ORDER BY day) INTO _daily
  FROM (
    SELECT date_trunc('day', created_at)::date AS day,
           count(*) AS n,
           count(DISTINCT sender_id) AS s
    FROM public.messages
    WHERE created_at > now() - (_days || ' days')::interval
    GROUP BY 1
  ) d;

  SELECT jsonb_agg(jsonb_build_object('match_id', match_id, 'messages', n, 'last_message_at', last_at) ORDER BY n DESC) INTO _top
  FROM (
    SELECT match_id, count(*) AS n, max(created_at) AS last_at
    FROM public.messages
    WHERE created_at > now() - interval '7 days'
    GROUP BY match_id
    ORDER BY count(*) DESC
    LIMIT 10
  ) t;

  RETURN jsonb_build_object(
    'totals', _totals,
    'daily', COALESCE(_daily, '[]'::jsonb),
    'top_conversations', COALESCE(_top, '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_messaging_stats(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_messaging_stats(int) TO authenticated;
