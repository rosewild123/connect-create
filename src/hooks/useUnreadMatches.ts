import { useEffect, useState, useCallback, useId } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns a map of matchId -> boolean (true if there's an unread message from the other user).
 * Also returns the total number of matches with unread messages.
 */
export function useUnreadMatches(me: string | null | undefined) {
  const instanceId = useId();
  const [unread, setUnread] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!me) { setUnread({}); setLoading(false); return; }
    const { data: matches } = await supabase.from("matches").select("id");
    if (!matches) { setUnread({}); setLoading(false); return; }
    const { data: reads } = await supabase.from("match_reads").select("match_id,last_read_at").eq("user_id", me);
    const readMap = new Map<string, string>((reads || []).map((r) => [r.match_id, r.last_read_at]));
    const result: Record<string, boolean> = {};
    await Promise.all(matches.map(async (m) => {
      const { data: msgs } = await supabase
        .from("messages")
        .select("created_at,sender_id")
        .eq("match_id", m.id)
        .order("created_at", { ascending: false })
        .limit(1);
      const last = msgs?.[0];
      if (!last || last.sender_id === me) { result[m.id] = false; return; }
      const lastRead = readMap.get(m.id);
      result[m.id] = !lastRead || new Date(last.created_at) > new Date(lastRead);
    }));
    setUnread(result);
    setLoading(false);
  }, [me]);

  useEffect(() => { refresh(); }, [refresh]);

  // Realtime: refresh on new messages or read receipts
  useEffect(() => {
    if (!me) return;
    const ch = supabase
      .channel(`unread:${me}:${instanceId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "match_reads", filter: `user_id=eq.${me}` }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [me, refresh, instanceId]);

  const totalUnread = Object.values(unread).filter(Boolean).length;
  return { unread, totalUnread, loading, refresh };
}
