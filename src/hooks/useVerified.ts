import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useVerified(userId: string | null) {
  const [verified, setVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setVerified(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    // Use SECURITY DEFINER RPC so we can read sensitive own-profile columns
    // (id_verified, age_verified) without relying on column-level grants.
    supabase
      .rpc("get_my_profile")
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const row = data as { id_verified?: boolean | null; age_verified?: boolean | null } | null;
        setVerified(Boolean(row?.id_verified && row?.age_verified !== false));
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId]);

  return { verified, loading };
}
