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
    const { data, error } = await supabase.rpc("get_hidden_user_ids");
    if (error) { setHidden(new Set()); setLoading(false); return; }
    const set = new Set<string>((data as unknown as string[]) || []);
    setHidden(set);
    setLoading(false);
  }, [me]);

  useEffect(() => { refresh(); }, [refresh]);

  return { hidden, loading, refresh };
}
