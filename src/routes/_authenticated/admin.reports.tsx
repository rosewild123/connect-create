import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, Loader2, ShieldAlert, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Admin" }] }),
  component: AdminReports,
});

type Report = {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reporter?: { display_name: string | null } | null;
  reported?: { display_name: string | null } | null;
};

function AdminReports() {
  const navigate = useNavigate();
  const [me, setMe] = useState<string | null>(null);
  const [filter, setFilter] = useState<"open" | "resolved" | "dismissed" | "all">("open");
  const [rows, setRows] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, loading: roleLoading } = useIsAdmin(me);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!me || roleLoading) return;
    if (!isAdmin) { setLoading(false); return; }
    (async () => {
      let q = supabase.from("reports").select("*").order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) { toast.error("Failed to load reports"); setLoading(false); return; }
      const rep = (data || []) as Report[];
      const ids = Array.from(new Set(rep.flatMap((r) => [r.reporter_id, r.reported_id])));
      const { data: profs } = await supabase.from("profiles_public").select("id,display_name").in("id", ids);
      const map = new Map((profs || []).filter((p) => p.id).map((p) => [p.id as string, p]));
      setRows(rep.map((r) => ({
        ...r,
        reporter: map.get(r.reporter_id) ?? null,
        reported: map.get(r.reported_id) ?? null,
      })));
      setLoading(false);
    })();
  }, [me, isAdmin, roleLoading, filter]);

  async function updateStatus(id: string, status: "resolved" | "dismissed") {
    const { error } = await supabase.from("reports").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setRows((prev) => prev.filter((r) => filter === "all" || r.status === filter ? r.id !== id || filter === "all" : true).map((r) => r.id === id ? { ...r, status } : r));
    toast.success(`Marked ${status}`);
  }

  if (roleLoading) {
    return <AppShell><div className="p-8 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div></AppShell>;
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="px-5 py-12 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-3 font-display text-2xl font-bold">Admins only</h1>
          <p className="mt-2 text-sm text-muted-foreground">You don't have access to this page.</p>
          <Button className="mt-6 rounded-full" onClick={() => navigate({ to: "/discover" })}>Back to app</Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="flex items-center gap-2 px-5 py-4">
        <button onClick={() => navigate({ to: "/settings" })} className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-2xl font-bold">Reports</h1>
      </header>

      <div className="flex gap-2 px-5 pb-3">
        {(["open", "resolved", "dismissed", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => { setLoading(true); setFilter(f); }}
            className={`rounded-full border px-3 py-1 text-xs capitalize ${filter === f ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3 px-5 pb-8">
        {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {!loading && rows.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No {filter === "all" ? "" : filter} reports.
          </div>
        )}
        {rows.map((r) => (
          <article key={r.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{r.reason.replace(/_/g, " ")}</div>
                <div className="mt-1 text-sm">
                  <span className="font-semibold">{r.reporter?.display_name ?? r.reporter_id.slice(0, 8)}</span>
                  <span className="text-muted-foreground"> reported </span>
                  <Link to="/u/$id" params={{ id: r.reported_id }} className="font-semibold text-primary hover:underline">
                    {r.reported?.display_name ?? r.reported_id.slice(0, 8)}
                  </Link>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                r.status === "open" ? "bg-primary/15 text-primary" :
                r.status === "resolved" ? "bg-emerald-500/15 text-emerald-500" :
                "bg-muted text-muted-foreground"
              }`}>{r.status}</span>
            </div>
            {r.details && (
              <p className="mt-3 rounded-lg bg-muted/40 p-3 text-sm">{r.details}</p>
            )}
            {r.status === "open" && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="rounded-full" onClick={() => updateStatus(r.id, "resolved")}>
                  <Check className="mr-1 h-4 w-4" /> Resolve
                </Button>
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => updateStatus(r.id, "dismissed")}>
                  <X className="mr-1 h-4 w-4" /> Dismiss
                </Button>
              </div>
            )}
          </article>
        ))}
      </div>
    </AppShell>
  );
}
