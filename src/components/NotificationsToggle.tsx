import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { enablePushNotifications, disablePushNotifications, pushSupported, pushPermission } from "@/lib/push";

export function NotificationsToggle() {
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSupported(pushSupported());
    setPerm(pushPermission());
    (async () => {
      if (!pushSupported()) return;
      const reg = await navigator.serviceWorker.getRegistration("/push-sw.js");
      const sub = await reg?.pushManager.getSubscription();
      setEnabled(!!sub);
    })();
  }, []);

  if (!supported) {
    return (
      <div className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
        Push notifications aren't supported in this browser.
      </div>
    );
  }

  async function toggle() {
    setBusy(true);
    try {
      if (enabled) {
        await disablePushNotifications();
        setEnabled(false);
        toast.success("Notifications disabled");
      } else {
        const res = await enablePushNotifications();
        if (res.ok) {
          setEnabled(true);
          setPerm("granted");
          toast.success("Notifications enabled");
        } else {
          toast.error(res.reason ?? "Could not enable notifications");
        }
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center text-primary">
        {enabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium">Push notifications</div>
        <div className="text-xs text-muted-foreground truncate">
          {enabled ? "On — you'll be notified of new matches and messages" : perm === "denied" ? "Blocked in your browser settings" : "Get notified about new matches and messages"}
        </div>
      </div>
      <Button size="sm" variant={enabled ? "outline" : "default"} onClick={toggle} disabled={busy || perm === "denied"}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : enabled ? "Turn off" : "Enable"}
      </Button>
    </div>
  );
}
