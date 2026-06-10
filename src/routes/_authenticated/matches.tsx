import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { MessageCircle } from "lucide-react";
import { useHiddenUserIds } from "@/hooks/useBlocks";

export const Route = createFileRoute("/_authenticated/matches")({
  head: () => ({ meta: [{ title: "Matches — Senda" }] }),
  component: Matches,
});

type MatchRow = {
  id: string;
  created_at: string;
  other: { id: string; display_name: string | null; photos: string[] };
  lastMessage?: { content: string; created_at: string } | null;
};

function Matches() {
  const [me, setMe] = useState<string | null>(null);
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoMap, setPhotoMap] = useState<Record<string, string>>({});

  useEffect(() => { (async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    setMe(u.user.id);
    const { data: matches } = await supabase.from("matches").select("*").order("created_at", { ascending: false });
    if (!matches) { setLoading(false); return; }
    const otherIds = matches.map((m) => m.user_a === u.user!.id ? m.user_b : m.user_a);
    const { data: profs } = await supabase.from("profiles").select("id,display_name,photos").in("id", otherIds);
    const profMap = new Map(profs?.map((p) => [p.id, p]));

    const result: MatchRow[] = await Promise.all(matches.map(async (m) => {
      const otherId = m.user_a === u.user!.id ? m.user_b : m.user_a;
      const other = profMap.get(otherId) || { id: otherId, display_name: "Creator", photos: [] };
      const { data: msgs } = await supabase.from("messages").select("content,created_at").eq("match_id", m.id).order("created_at", { ascending: false }).limit(1);
      return { id: m.id, created_at: m.created_at, other: other as MatchRow["other"], lastMessage: msgs?.[0] || null };
    }));
    setRows(result);

    const urls: Record<string, string> = {};
    await Promise.all(result.map(async (r) => {
      const p = r.other.photos?.[0];
      if (p) {
        const { data } = await supabase.storage.from("profile-photos").createSignedUrl(p, 3600);
        if (data) urls[r.other.id] = data.signedUrl;
      }
    }));
    setPhotoMap(urls);
    setLoading(false);
  })(); }, []);

  return (
    <AppShell>
      <header className="px-5 py-4">
        <h1 className="font-display text-3xl font-bold">Matches</h1>
      </header>

      <div className="px-5">
        {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
        {!loading && rows.length === 0 && (
          <div className="mt-12 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-primary"><MessageCircle className="h-7 w-7" /></div>
            <h2 className="font-display text-2xl font-bold">No matches yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">Keep swiping in Discover.</p>
          </div>
        )}
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <Link to="/matches/$id" params={{ id: r.id }} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition hover:border-primary">
                <div className="h-14 w-14 overflow-hidden rounded-full bg-muted">
                  {photoMap[r.other.id] && <img src={photoMap[r.other.id]} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{r.other.display_name}</div>
                  <div className="truncate text-sm text-muted-foreground">
                    {r.lastMessage ? r.lastMessage.content : "Say hi 👋"}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
