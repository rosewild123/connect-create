import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePresenceHeartbeat } from "@/lib/presence";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    if (!location.pathname.startsWith("/onboarding")) {
      const { data: p } = await supabase
        .from("profiles")
        .select("is_onboarded")
        .eq("id", data.user.id)
        .maybeSingle();
      if (!p?.is_onboarded) throw redirect({ to: "/onboarding" });
    }
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUid(session?.user?.id ?? null);
    });
    return () => { sub.subscription.unsubscribe(); };
  }, []);
  usePresenceHeartbeat(uid);
  return <Outlet />;
}
