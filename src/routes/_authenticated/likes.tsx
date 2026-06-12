import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useSubscription } from "@/hooks/useSubscription";
import { Heart, X, Lock, ArrowLeft, Star } from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { ageFromDob } from "@/lib/senda";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/likes")({
  head: () => ({ meta: [{ title: "Likes you — Senda" }] }),
  component: LikesPage,
});

type LikerProfile = {
  id: string;
  display_name: string | null;
  date_of_birth: string | null;
  location_city: string | null;
  location_country: string | null;
  niches: string[];
  photos: string[];
  photo_verified?: boolean;
  isSuper?: boolean;
};

function LikesPage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<string | null>(null);
  const [likers, setLikers] = useState<LikerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { isActive: isPlus, loading: subLoading } = useSubscription(me);

  useEffect(() => { (async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    setMe(u.user.id);
  })(); }, []);

  useEffect(() => { (async () => {
    if (!me || !isPlus) { setLoading(false); return; }
    const { data: incoming, error } = await supabase.from("swipes")
      .select("swiper_id, direction").eq("swipee_id", me).in("direction", ["like", "super"]);
    if (error) { toast.error(error.message); setLoading(false); return; }
    const { data: mine } = await supabase.from("swipes")
      .select("swipee_id").eq("swiper_id", me);
    const { data: hiddenIds } = await supabase.rpc("get_hidden_user_ids");
    const hiddenSet = new Set<string>((hiddenIds as unknown as string[]) || []);
    const swipedIds = new Set((mine || []).map((r) => r.swipee_id));
    const superSet = new Set((incoming || []).filter((r) => r.direction === "super").map((r) => r.swiper_id));
    const ids = Array.from(new Set((incoming || []).map((r) => r.swiper_id)))
      .filter((id) => !swipedIds.has(id) && !hiddenSet.has(id));
    if (ids.length === 0) { setLikers([]); setLoading(false); return; }
    const { data: profs } = await supabase.from("profiles_public")
      .select("id, display_name, age, location_city, location_country, niches, photos, photo_verified")
      .in("id", ids);
    const merged = (profs || []).map((p) => ({ ...p, isSuper: superSet.has(p.id) })) as LikerProfile[];
    // Super likes first
    merged.sort((a, b) => Number(b.isSuper) - Number(a.isSuper));
    setLikers(merged);
    setLoading(false);
  })(); }, [me, isPlus]);

  async function act(targetId: string, dir: "like" | "pass") {
    if (!me) return;
    setLikers((prev) => prev.filter((l) => l.id !== targetId));
    const { error } = await supabase.from("swipes").insert({ swiper_id: me, swipee_id: targetId, direction: dir });
    if (error) { toast.error(error.message); return; }
    if (dir === "like") {
      const { data: m } = await supabase.from("matches").select("id")
        .or(`and(user_a.eq.${me},user_b.eq.${targetId}),and(user_a.eq.${targetId},user_b.eq.${me})`)
        .maybeSingle();
      if (m) {
        toast.success("It's a match! 🔥", {
          action: { label: "Message", onClick: () => navigate({ to: "/matches/$id", params: { id: m.id } }) },
        });
      }
    }
  }

  return (
    <AppShell>
      <header className="flex items-center gap-3 px-5 py-4">
        <Link to="/discover" className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-2xl font-bold">Likes you</h1>
      </header>

      <div className="px-5">
        {subLoading || loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0,1,2,3].map((i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-card" />)}
          </div>
        ) : !isPlus ? (
          <PlusGate />
        ) : likers.length === 0 ? (
          <div className="mt-16 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-primary"><Heart className="h-7 w-7" /></div>
            <h2 className="font-display text-2xl font-bold">No new likes yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">Keep swiping — new likes appear here as they come in.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {likers.map((p) => <LikerCard key={p.id} profile={p} onAct={act} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function LikerCard({ profile, onAct }: { profile: LikerProfile; onAct: (id: string, d: "like" | "pass") => void }) {
  const [url, setUrl] = useState<string>("");
  useEffect(() => { (async () => {
    if (!profile.photos[0]) return;
    const { data } = await supabase.storage.from("profile-photos").createSignedUrl(profile.photos[0], 3600);
    setUrl(data?.signedUrl || "");
  })(); }, [profile.id]);

  const age = ageFromDob(profile.date_of_birth);
  const loc = [profile.location_city, profile.location_country].filter(Boolean).join(", ");

  return (
    <div className="swipe-card-shadow relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted">
      {url ? (
        <img src={url} alt={profile.display_name || ""} className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center text-xs text-muted-foreground">No photo</div>
      )}
      {profile.isSuper && (
        <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
          <Star className="h-3 w-3 fill-current" /> SUPER
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-3 text-white">
        <div className="flex items-center gap-1 font-display text-base font-bold leading-tight">
          {profile.display_name}{age && <span className="font-sans text-sm font-normal">, {age}</span>}
          {profile.photo_verified && <VerifiedBadge className="h-3.5 w-3.5" />}
        </div>
        {loc && <div className="text-[11px] text-white/80 line-clamp-1">{loc}</div>}
        <div className="mt-2 flex gap-1.5">
          <button onClick={() => onAct(profile.id, "pass")}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/15 backdrop-blur hover:bg-white/25"
            aria-label="Pass"><X className="h-4 w-4" /></button>
          <button onClick={() => onAct(profile.id, "like")}
            className="grid h-8 flex-1 place-items-center rounded-full bg-primary text-primary-foreground hover:scale-[1.02] transition"
            aria-label="Like"><Heart className="h-4 w-4 fill-current" /></button>
        </div>
      </div>
    </div>
  );
}

function PlusGate() {
  return (
    <div className="mt-12 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-primary"><Lock className="h-7 w-7" /></div>
      <h2 className="font-display text-2xl font-bold">See who liked you</h2>
      <p className="mt-2 text-sm text-muted-foreground">Skip the guesswork. Upgrade to Senda Plus to see everyone who's already liked you.</p>
      <Button asChild className="mt-5 rounded-full px-6">
        <Link to="/upgrade">Get Senda Plus</Link>
      </Button>
    </div>
  );
}
