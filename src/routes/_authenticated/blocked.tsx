import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useProfilePhotoUrl } from "@/hooks/useProfilePhotoUrls";

export const Route = createFileRoute("/_authenticated/blocked")({
  head: () => ({ meta: [{ title: "Blocked users — Senda" }] }),
  component: BlockedPage,
});

type Row = {
  id: string;
  blocked_id: string;
  created_at: string;
  profile: { display_name: string | null; photos: string[] } | null;
};

function BlockedPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data: blocks } = await supabase.from("blocks")
      .select("id, blocked_id, created_at")
      .eq("blocker_id", u.user.id)
      .order("created_at", { ascending: false });
    if (!blocks?.length) { setRows([]); setLoading(false); return; }
    const ids = blocks.map((b) => b.blocked_id);
    const { data: profs } = await supabase.from("profiles_public")
      .select("id, display_name, photos").in("id", ids);
    const map = new Map((profs ?? []).filter((p) => p.id).map((p) => [p.id as string, p]));
    const merged: Row[] = blocks.map((b) => ({
      ...b,
      profile: (map.get(b.blocked_id) as Row["profile"]) || null,
    }));
    setRows(merged);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function unblock(blockedId: string) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("blocks").delete()
      .eq("blocker_id", u.user.id).eq("blocked_id", blockedId);
    if (error) { toast.error(error.message); return; }
    toast.success("Unblocked");
    setRows((r) => r.filter((x) => x.blocked_id !== blockedId));
  }

  return (
    <AppShell>
      <header className="flex items-center gap-3 px-5 py-4">
        <Link to="/profile" className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-2xl font-bold">Blocked users</h1>
      </header>

      <div className="px-5">
        {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
        {!loading && rows.length === 0 && (
          <div className="mt-16 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-muted text-muted-foreground"><Ban className="h-7 w-7" /></div>
            <h2 className="font-display text-2xl font-bold">No one blocked</h2>
            <p className="mt-2 text-sm text-muted-foreground">Profiles you block will appear here.</p>
          </div>
        )}
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
              <BlockedAvatar photo={r.profile?.photos?.[0]} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{r.profile?.display_name || "Creator"}</div>
                <div className="text-xs text-muted-foreground">Blocked {new Date(r.created_at).toLocaleDateString()}</div>
              </div>
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => unblock(r.blocked_id)}>
                Unblock
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}

function BlockedAvatar({ photo }: { photo?: string }) {
  const url = useProfilePhotoUrl(photo);
  return (
    <div className="h-12 w-12 overflow-hidden rounded-full bg-muted">
      {url && <img src={url} alt="" className="h-full w-full object-cover" />}
    </div>
  );
}
