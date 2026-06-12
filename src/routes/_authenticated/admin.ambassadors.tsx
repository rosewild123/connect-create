import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Crown, ShieldAlert, X, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export const Route = createFileRoute("/_authenticated/admin/ambassadors")({
  head: () => ({ meta: [{ title: "Ambassadors — Admin" }] }),
  component: AdminAmbassadors,
});

type Row = { id: string; display_name: string | null; created_at: string };
type SearchRow = { id: string; display_name: string | null; is_ambassador: boolean };

function AdminAmbassadors() {
  const navigate = useNavigate();
  const [me, setMe] = useState<string | null>(null);
  const { isAdmin, loading: roleLoading } = useIsAdmin(me);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchRow[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("list_ambassadors");
    if (error) toast.error(error.message);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!me || roleLoading || !isAdmin) return;
    load();
  }, [me, roleLoading, isAdmin]);

  if (roleLoading) {
    return <AppShell><div className="p-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div></AppShell>;
  }
  if (!isAdmin) {
    return (
      <AppShell>
        <div className="p-6 text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Admins only.</p>
          <Button variant="outline" onClick={() => navigate({ to: "/discover" })}>Back</Button>
        </div>
      </AppShell>
    );
  }

  const grant = async (id: string) => {
    if (!id.trim()) return toast.error("Enter a user ID");
    setBusy(true);
    const { data, error } = await supabase.rpc("set_ambassador", { _user_id: id.trim(), _is: true });
    setBusy(false);
    if (error) return toast.error(error.message);
    const res = data as { ok: boolean; error?: string };
    if (!res.ok) return toast.error(res.error ?? "Failed");
    toast.success("Ambassador granted — free for life 👑");
    setUserId("");
    load();
    if (search) doSearch();
  };

  const revoke = async (id: string) => {
    if (!confirm("Revoke Ambassador status?")) return;
    const { data, error } = await supabase.rpc("set_ambassador", { _user_id: id, _is: false });
    if (error) return toast.error(error.message);
    const res = data as { ok: boolean; error?: string };
    if (!res.ok) return toast.error(res.error ?? "Failed");
    toast.success("Revoked");
    load();
    if (search) doSearch();
  };

  const doSearch = async () => {
    if (!search.trim()) { setResults([]); return; }
    const { data, error } = await supabase.rpc("admin_search_profiles", { _query: search.trim() });
    if (error) return toast.error(error.message);
    setResults((data as SearchRow[]) ?? []);
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
        <header>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Crown className="h-6 w-6 text-amber-500" /> Ambassadors
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ambassadors get <span className="font-semibold text-foreground">Senda Premium free for life</span>.
          </p>
        </header>

        <div className="rounded-lg border p-4 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Grant by user ID</h2>
          <div className="space-y-1">
            <Label htmlFor="uid">User ID</Label>
            <div className="flex gap-2">
              <Input id="uid" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="uuid…" />
              <Button onClick={() => grant(userId)} disabled={busy}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Grant"}
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><Search className="w-4 h-4" /> Search by display name</h2>
          <div className="flex gap-2">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doSearch()} placeholder="Name…" />
            <Button variant="outline" onClick={doSearch}>Search</Button>
          </div>
          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((r) => (
                <div key={r.id} className="rounded border p-2 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{r.display_name ?? "(no name)"}</div>
                    <div className="text-xs text-muted-foreground font-mono truncate">{r.id}</div>
                  </div>
                  {r.is_ambassador ? (
                    <Button size="sm" variant="outline" onClick={() => revoke(r.id)}><X className="h-3.5 w-3.5 mr-1" /> Revoke</Button>
                  ) : (
                    <Button size="sm" onClick={() => grant(r.id)}><Crown className="h-3.5 w-3.5 mr-1" /> Make Ambassador</Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="font-semibold">Current Ambassadors ({rows.length})</h2>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No ambassadors yet.</p>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => (
                <div key={r.id} className="rounded-lg border p-3 flex items-center gap-3">
                  <Crown className="h-5 w-5 text-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{r.display_name ?? "(no name)"}</div>
                    <div className="text-xs text-muted-foreground font-mono truncate">{r.id}</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => revoke(r.id)}><X className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
