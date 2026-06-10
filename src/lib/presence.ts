import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const HEARTBEAT_MS = 60_000;
export const ONLINE_THRESHOLD_MS = 2 * 60_000;

/** Updates the current user's profiles.last_active_at while the tab is visible. */
export function usePresenceHeartbeat(userId: string | null | undefined) {
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function ping() {
      if (cancelled || document.visibilityState !== "visible") return;
      await supabase.from("profiles").update({ last_active_at: new Date().toISOString() }).eq("id", userId!);
    }
    function onVisibility() { if (document.visibilityState === "visible") ping(); }

    ping();
    timer = setInterval(ping, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, [userId]);
}

export function presenceLabel(lastActiveAt: string | null | undefined): { online: boolean; label: string } {
  if (!lastActiveAt) return { online: false, label: "" };
  const diff = Date.now() - new Date(lastActiveAt).getTime();
  if (diff < ONLINE_THRESHOLD_MS) return { online: true, label: "Online now" };
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return { online: false, label: `Active ${mins}m ago` };
  const hours = Math.floor(mins / 60);
  if (hours < 24) return { online: false, label: `Active ${hours}h ago` };
  const days = Math.floor(hours / 24);
  if (days < 7) return { online: false, label: `Active ${days}d ago` };
  return { online: false, label: "" };
}
