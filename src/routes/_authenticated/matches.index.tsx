import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { MessageCircle } from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { PresenceIndicator } from "@/components/PresenceIndicator";
import { useHiddenUserIds } from "@/hooks/useBlocks";
import { useUnreadMatches } from "@/hooks/useUnreadMatches";
import { useProfilePhotoUrl } from "@/hooks/useProfilePhotoUrls";

export const Route = createFileRoute("/_authenticated/matches/")({
  head: () => ({ meta: [{ title: "Matches — Senda" }] }),
  component: Matches,
});

type MatchRow = {
  id: string;
  created_at: string;
  other: { id: string; display_name: string | null; photos: string[]; photo_verified?: boolean; last_active_at?: string | null };
  lastMessage?: { content: string | null; created_at: string; media_type: string | null } | null;
};

function Matches() {
  const [me, setMe] = useState<string | null>(null);
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { hidden } = useHiddenUserIds(me);
  const { unread } = useUnreadMatches(me);
  const visibleRows = rows.filter((r) => !hidden.has(r.other.id));

  useEffect(() => { (async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    setMe(u.user.id);
    const { data: matches } = await supabase.from("matches").select("*").order("created_at", { ascending: false });
    if (!matches) { setLoading(false); return; }
    const otherIds = matches.map((m) => m.user_a === u.user!.id ? m.user_b : m.user_a);
    const { data: profs } = await supabase.from("profiles_public").select("id,display_name,photos,photo_verified,last_active_at").in("id", otherIds);
    const profMap = new Map((profs ?? []).filter((p) => p.id).map((p) => [p.id as string, p]));

    const result: MatchRow[] = await Promise.all(matches.map(async (m) => {
      const otherId = m.user_a === u.user!.id ? m.user_b : m.user_a;
      const other = profMap.get(otherId) || { id: otherId, display_name: "Creator", photos: [] };
      const { data: msgs } = await supabase.from("messages").select("content,created_at,media_type").eq("match_id", m.id).order("created_at", { ascending: false }).limit(1);
      return { id: m.id, created_at: m.created_at, other: other as MatchRow["other"], lastMessage: msgs?.[0] || null };
    }));
    setRows(result);
    setLoading(false);
  })(); }, []);

  return (
    <AppShell>
      <header className="px-5 py-4">
        <h1 className="font-display text-3xl font-bold">Matches</h1>
      </header>

      <div className="px-5">
        {loading && <div className="text-sm text-muted-foreground">Loading...</div>}
        {!loading && visibleRows.length === 0 && (
          <div className="mt-12 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-primary"><MessageCircle className="h-7 w-7" /></div>
            <h2 className="font-display text-2xl font-bold">No matches yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">Keep swiping in Discover.</p>
          </div>
        )}
        <ul className="space-y-2">
          {visibleRows.map((r) => (
            <li key={r.id}>
              <Link to="/matches/$id" params={{ id: r.id }} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition hover:border-primary">
                <MatchAvatar photo={r.other.photos?.[0]} lastActiveAt={r.other.last_active_at} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 font-semibold">{r.other.display_name}{r.other.photo_verified && <VerifiedBadge className="h-3.5 w-3.5" />}</div>
                  <div className={`truncate text-sm ${unread[r.id] ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    {r.lastMessage
                      ? (r.lastMessage.media_type === "image" ? "📷 Photo"
                        : r.lastMessage.media_type === "audio" ? "🎤 Voice note"
                        : r.lastMessage.content || "Say hi 👋")
                      : "Say hi 👋"}
                  </div>
                </div>
                {unread[r.id] && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}

function MatchAvatar({ photo, lastActiveAt }: { photo?: string; lastActiveAt?: string | null }) {
  const url = useProfilePhotoUrl(photo);
  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-muted">
      {url && <img src={url} alt="" className="h-full w-full object-cover" />}
      <PresenceIndicator lastActiveAt={lastActiveAt} variant="dot" className="absolute bottom-0 right-0" />
    </div>
  );
}
