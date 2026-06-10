import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the set of user ids that are hidden from `me` for either reason:
 * - `me` blocked them
 * - they blocked `me`
 */
export function useHiddenUserIds(me: string | null | undefined) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!me) { setHidden(new Set()); setLoading(false); return; }
    const [a, b] = await Promise.all([
      supabase.from("blocks").select("blocked_id").eq("blocker_id", me),
      supabase.from("blocks").select("blocker_id").eq("blocked_id", me),
    ]);
    const set = new Set<string>();
    a.data?.forEach((r) => set.add(r.blocked_id));
    b.data?.forEach((r) => set.add(r.blocker_id));
    setHidden(set);
    setLoading(false);
  }, [me]);

  useEffect(() => { refresh(); }, [refresh]);

  return { hidden, loading, refresh };
}
