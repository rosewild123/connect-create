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
import { useVerified } from "@/hooks/useVerified";
import { VerifiedGate } from "@/components/VerifiedGate";
import { ProtectedPhoto } from "@/components/ProtectedPhoto";
import { useProfilePhotoUrl } from "@/hooks/useProfilePhotoUrls";

export const Route = createFileRoute("/_authenticated/likes")({
  head: () => ({
    meta: [
      { title: "Creators who liked you — Senda" },
      { name: "description", content: "See which verified creators have already liked your Senda profile and swipe back to match instantly." },
      { property: "og:title", content: "Creators who liked you — Senda" },
      { property: "og:description", content: "See which verified creators liked your profile and swipe back to match." },
      { property: "og:url", content: "https://sendaclub.live/likes" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://sendaclub.live/likes" }],
  }),
  component: LikesPage,
});

type LikerProfile = {
  id: string;
  display_name: string | null;
  age: number | null;
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
  const { verified, loading: verifyLoading } = useVerified(me);

  useEffect(() => { (async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    setMe(u.user.id);
  })(); }, []);

  useEffect(() => { (async () => {
    if (!me) { setLoading(false); return; }
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
    const merged = (profs || []).filter((p) => p.id).map((p) => ({ ...p, isSuper: superSet.has(p.id!) })) as unknown as LikerProfile[];
    // Super likes first
    merged.sort((a, b) => Number(b.isSuper) - Number(a.isSuper));
    setLikers(merged);
    setLoading(false);
  })(); }, [me]);

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
        {subLoading || loading || verifyLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0,1,2,3].map((i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-card" />)}
          </div>
        ) : verified === false ? (
          <VerifiedGate />
        ) : likers.length === 0 ? (
          <div className="mt-16 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-primary"><Heart className="h-7 w-7" /></div>
            <h2 className="font-display text-2xl font-bold">No new likes yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">Keep swiping — new likes appear here as they come in.</p>
          </div>
        ) : (
          <>
            {!isPlus && <PlusTeaserBanner count={likers.length} />}
            <div className="grid grid-cols-2 gap-3">
              {likers.map((p) =>
                isPlus
                  ? <LikerCard key={p.id} profile={p} onAct={act} />
                  : <BlurredLikerCard key={p.id} profile={p} />
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function LikerCard({ profile, onAct }: { profile: LikerProfile; onAct: (id: string, d: "like" | "pass") => void }) {
  const url = useProfilePhotoUrl(profile.photos[0]);

  const age = profile.age;
  const loc = [profile.location_city, profile.location_country].filter(Boolean).join(", ");

  return (
    <div className="swipe-card-shadow relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted">
      {url ? (
        <ProtectedPhoto src={url} alt={profile.display_name || ""} />
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

function PlusTeaserBanner({ count }: { count: number }) {
  return (
    <div className="mb-4 rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 to-transparent p-4 text-center">
      <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground">
        <Lock className="h-5 w-5" />
      </div>
      <h2 className="font-display text-xl font-bold">
        {count} {count === 1 ? "creator has" : "creators have"} liked you
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Upgrade to Senda Plus to see who they are and match with one tap.
      </p>
      <Button asChild className="mt-3 rounded-full px-6">
        <Link to="/upgrade">Get Senda Plus</Link>
      </Button>
    </div>
  );
}

function BlurredLikerCard({ profile }: { profile: LikerProfile }) {
  const url = useProfilePhotoUrl(profile.photos[0]);
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate({ to: "/upgrade" })}
      aria-label="Upgrade to see who liked you"
      className="swipe-card-shadow relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-muted"
    >
      {url ? (
        <img src={url} alt="" aria-hidden className="h-full w-full scale-110 object-cover blur-2xl" draggable={false} />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-primary/30 to-muted" />
      )}
      <div className="absolute inset-0 grid place-items-center bg-black/30">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white backdrop-blur">
          <Lock className="h-5 w-5" />
        </div>
      </div>
      {profile.isSuper && (
        <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
          <Star className="h-3 w-3 fill-current" /> SUPER
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-3 text-center text-[11px] font-semibold text-white">
        Tap to unlock
      </div>
    </button>
  );
}
