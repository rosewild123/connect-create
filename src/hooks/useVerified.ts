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
    supabase
      .from("profiles")
      .select("id_verified, age_verified")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setVerified(Boolean(data?.id_verified && data?.age_verified !== false));
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId]);

  return { verified, loading };
}
