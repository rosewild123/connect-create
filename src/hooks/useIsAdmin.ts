import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useIsAdmin(me: string | null | undefined) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!me) { setIsAdmin(false); setLoading(false); return; }
    (async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", me).eq("role", "admin").maybeSingle();
      setIsAdmin(!!data);
      setLoading(false);
    })();
  }, [me]);
  return { isAdmin, loading };
}
