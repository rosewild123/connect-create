import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, Loader2, ShieldAlert, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export const Route = createFileRoute("/_authenticated/admin/messaging")({
  head: () => ({ meta: [{ title: "Messaging — Admin" }] }),
  component: AdminMessaging,
});

type Totals = {
  total_matches: number;
  matches_with_messages: number;
  silent_matches: number;
  total_messages: number;
  messages_last_24h: number;
  messages_last_7d: number;
  active_senders_7d: number;
  active_conversations_7d: number;
};
type Daily = { day: string; messages: number; senders: number };
type TopConv = { match_id: string; messages: number; last_message_at: string };

function AdminMessaging() {
  const navigate = useNavigate();
  const [me, setMe] = useState<string | null>(null);
  const { isAdmin, loading: roleLoading } = useIsAdmin(me);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [daily, setDaily] = useState<Daily[]>([]);
  const [top, setTop] = useState<TopConv[]>([]);

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null)); }, []);

  useEffect(() => {
    if (!me || roleLoading || !isAdmin) { if (!roleLoading) setLoading(false); return; }
    setLoading(true);
    (async () => {
      const { data, error } = await supabase.rpc("admin_messaging_stats" as never, { _days: days } as never);
      if (error || !data) { setLoading(false); return; }
      const d = data as { totals: Totals; daily: Daily[]; top_conversations: TopConv[] };
      setTotals(d.totals);
      setDaily(d.daily || []);
      setTop(d.top_conversations || []);
      setLoading(false);
    })();
  }, [me, isAdmin, roleLoading, days]);

  if (roleLoading) {
    return <AppShell><div className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div></AppShell>;
  }
  if (!isAdmin) {
    return (
      <AppShell>
        <div className="px-5 py-12 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-3 font-display text-2xl font-bold">Admins only</h1>
          <Button className="mt-6 rounded-full" onClick={() => navigate({ to: "/discover" })}>Back to app</Button>
        </div>
      </AppShell>
    );
  }

  const maxDaily = Math.max(1, ...daily.map((d) => d.messages));

  return (
    <AppShell>
      <header className="flex items-center gap-2 px-5 py-4">
        <button onClick={() => navigate({ to: "/settings" })} className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-2xl font-bold">Messaging</h1>
      </header>

      <p className="px-5 pb-3 text-xs text-muted-foreground">
        Aggregate activity only — message content is never shown.
      </p>

      {loading && <div className="px-5 text-sm text-muted-foreground">Loading…</div>}

      {!loading && totals && (
        <>
          <div className="grid grid-cols-2 gap-3 px-5">
            <Stat label="Messages (24h)" value={totals.messages_last_24h} />
            <Stat label="Messages (7d)" value={totals.messages_last_7d} />
            <Stat label="Active senders (7d)" value={totals.active_senders_7d} />
            <Stat label="Active chats (7d)" value={totals.active_conversations_7d} />
            <Stat label="Total messages" value={totals.total_messages} />
            <Stat label="Total matches" value={totals.total_matches} />
            <Stat label="Matches w/ msgs" value={totals.matches_with_messages} />
            <Stat label="Silent matches" value={totals.silent_matches} />
          </div>

          <div className="mt-6 px-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Daily messages</h2>
              <div className="flex gap-1">
                {[7, 14, 30].map((n) => (
                  <button key={n} onClick={() => setDays(n)} className={`rounded-full border px-2.5 py-0.5 text-xs ${days === n ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                    {n}d
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              {daily.length === 0 ? (
                <div className="text-sm text-muted-foreground">No messages in this range.</div>
              ) : (
                <div className="flex h-40 items-end gap-1">
                  {daily.map((d) => (
                    <div key={d.day} className="group relative flex-1" title={`${d.day}: ${d.messages} msgs · ${d.senders} senders`}>
                      <div className="w-full rounded-t bg-primary/80" style={{ height: `${(d.messages / maxDaily) * 100}%` }} />
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                <span>{daily[0]?.day.slice(5)}</span>
                <span>{daily[daily.length - 1]?.day.slice(5)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 px-5 pb-8">
            <h2 className="mb-2 font-display text-lg font-bold">Top conversations (7d)</h2>
            <div className="rounded-2xl border border-border bg-card">
              {top.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">No active conversations.</div>
              ) : top.map((t) => (
                <div key={t.match_id} className="flex items-center justify-between border-b border-border px-4 py-3 last:border-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      {t.match_id.slice(0, 8)}…
                    </div>
                    <div className="text-xs text-muted-foreground">Last: {new Date(t.last_message_at).toLocaleString()}</div>
                  </div>
                  <div className="text-sm font-semibold">{t.messages} msgs</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value.toLocaleString()}</div>
    </div>
  );
}
