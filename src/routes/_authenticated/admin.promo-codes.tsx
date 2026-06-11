import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Copy, Plus, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export const Route = createFileRoute("/_authenticated/admin/promo-codes")({
  head: () => ({ meta: [{ title: "Promo Codes — Admin" }] }),
  component: AdminPromoCodes,
});

type Row = {
  id: string;
  code: string;
  tier: string;
  duration_days: number;
  max_uses: number;
  uses: number;
  expires_at: string | null;
  note: string | null;
  created_at: string;
};

function genCode(prefix: string) {
  const clean = prefix.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return clean ? `${clean}-${rand}` : `INV-${rand}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function AdminPromoCodes() {
  const navigate = useNavigate();
  const [me, setMe] = useState<string | null>(null);
  const { isAdmin, loading: roleLoading } = useIsAdmin(me);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  // form
  const [prefix, setPrefix] = useState("");
  const [tier, setTier] = useState<"premium" | "plus">("premium");
  const [days, setDays] = useState(365);
  const [maxUses, setMaxUses] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [note, setNote] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("promo_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!me || roleLoading || !isAdmin) return;
    load();
  }, [me, roleLoading, isAdmin]);

  if (roleLoading) {
    return <AppShell title="Promo Codes"><div className="p-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div></AppShell>;
  }
  if (!isAdmin) {
    return (
      <AppShell title="Promo Codes">
        <div className="p-6 text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Admins only.</p>
          <Button variant="outline" onClick={() => navigate({ to: "/discover" })}>Back</Button>
        </div>
      </AppShell>
    );
  }

  const create = async () => {
    if (days < 1 || days > 3650) return toast.error("Duration must be 1–3650 days");
    if (maxUses < 1 || maxUses > 10000) return toast.error("Max uses must be 1–10000");
    setCreating(true);
    const code = genCode(prefix);
    const expires_at = expiresInDays > 0
      ? new Date(Date.now() + expiresInDays * 86400000).toISOString()
      : null;
    const { error } = await supabase.from("promo_codes").insert({
      code,
      tier,
      duration_days: days,
      max_uses: maxUses,
      expires_at,
      note: note.trim() || null,
      created_by: me,
    });
    setCreating(false);
    if (error) return toast.error(error.message);
    toast.success(`Created ${code}`);
    setPrefix(""); setNote("");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this code?")) return;
    const { error } = await supabase.from("promo_codes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRows((r) => r.filter((x) => x.id !== id));
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/redeem?code=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied");
  };

  return (
    <AppShell title="Promo Codes">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="rounded-lg border p-4 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> New code</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="prefix">Prefix (optional)</Label>
              <Input id="prefix" value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="ALEX" maxLength={20} />
            </div>
            <div className="space-y-1">
              <Label>Tier</Label>
              <Select value={tier} onValueChange={(v) => setTier(v as "premium" | "plus")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="plus">Plus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="days">Duration (days)</Label>
              <Input id="days" type="number" min={1} max={3650} value={days} onChange={(e) => setDays(parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="maxUses">Max uses</Label>
              <Input id="maxUses" type="number" min={1} max={10000} value={maxUses} onChange={(e) => setMaxUses(parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="expires">Code expires in (days, 0 = never)</Label>
              <Input id="expires" type="number" min={0} max={3650} value={expiresInDays} onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="note">Note (optional)</Label>
              <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Alex @ Instagram" maxLength={200} />
            </div>
          </div>
          <Button onClick={create} disabled={creating} className="w-full sm:w-auto">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create code"}
          </Button>
        </div>

        <div className="space-y-2">
          <h2 className="font-semibold">Existing codes</h2>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No codes yet.</p>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => {
                const expired = r.expires_at && new Date(r.expires_at) < new Date();
                const exhausted = r.uses >= r.max_uses;
                return (
                  <div key={r.id} className="rounded-lg border p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono font-semibold truncate">{r.code}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.tier} · {r.duration_days}d · {r.uses}/{r.max_uses} used
                        {r.expires_at && ` · expires ${new Date(r.expires_at).toLocaleDateString()}`}
                        {expired && " · EXPIRED"}
                        {exhausted && " · USED UP"}
                      </div>
                      {r.note && <div className="text-xs text-muted-foreground mt-0.5">{r.note}</div>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyLink(r.code)}>
                        <Copy className="w-3.5 h-3.5 mr-1" /> Copy link
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
