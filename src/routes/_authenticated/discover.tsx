import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Heart, X, MapPin, Flame, Sparkles, Lock } from "lucide-react";
import { ageFromDob, type Platform } from "@/lib/senda";
import { useSubscription, FREE_DAILY_SWIPES } from "@/hooks/useSubscription";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/discover")({
  head: () => ({ meta: [{ title: "Discover — Senda" }] }),
  component: Discover,
});

type Profile = {
  id: string;
  display_name: string | null;
  bio: string | null;
  date_of_birth: string | null;
  location_city: string | null;
  location_country: string | null;
  willing_to_travel: boolean;
  experience_years: number | null;
  completed_collabs: number;
  looking_for: string[];
  niches: string[];
  platforms: Platform[];
  photos: string[];
};

function Discover() {
  const navigate = useNavigate();
  const [me, setMe] = useState<string | null>(null);
  const [deck, setDeck] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [swipesToday, setSwipesToday] = useState(0);
  const { isActive: isPlus } = useSubscription(me);

  const limitReached = !isPlus && swipesToday >= FREE_DAILY_SWIPES;
  const remaining = Math.max(0, FREE_DAILY_SWIPES - swipesToday);

  useEffect(() => { (async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    setMe(u.user.id);
    const { data: mine } = await supabase.from("profiles").select("is_onboarded").eq("id", u.user.id).maybeSingle();
    if (!mine?.is_onboarded) { navigate({ to: "/onboarding" }); return; }

    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const { count } = await supabase.from("swipes").select("id", { count: "exact", head: true })
      .eq("swiper_id", u.user.id).gte("created_at", startOfDay.toISOString());
    setSwipesToday(count ?? 0);

    const { data: swipes } = await supabase.from("swipes").select("swipee_id").eq("swiper_id", u.user.id);
    const excluded = new Set([u.user.id, ...(swipes?.map((s) => s.swipee_id) || [])]);
    const { data: profs, error } = await supabase
      .from("profiles").select("*").eq("is_onboarded", true).limit(50);
    if (error) toast.error(error.message);
    const filtered = (profs || []).filter((p) => !excluded.has(p.id)) as unknown as Profile[];
    setDeck(filtered);
    setLoading(false);
  })(); }, [navigate]);

  const current = deck[0];

  async function swipe(dir: "like" | "pass") {
    if (!current || !me) return;
    if (limitReached) { navigate({ to: "/upgrade" }); return; }
    const target = current;
    setDeck(deck.slice(1));
    setPhotoIdx(0);
    setSwipesToday((n) => n + 1);
    const { error } = await supabase.from("swipes").insert({ swiper_id: me, swipee_id: target.id, direction: dir });
    if (error) { toast.error(error.message); return; }
    if (dir === "like") {
      const { data: m } = await supabase.from("matches").select("id")
        .or(`and(user_a.eq.${me},user_b.eq.${target.id}),and(user_a.eq.${target.id},user_b.eq.${me})`)
        .maybeSingle();
      if (m) {
        toast.success(`It's a match with ${target.display_name}! 🔥`, {
          action: { label: "Message", onClick: () => navigate({ to: "/matches/$id", params: { id: m.id } }) },
        });
      }
    }
  }

  return (
    <AppShell>
      <header className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-display text-lg font-bold">s</div>
          <span className="font-display text-xl font-bold">senda</span>
        </div>
        {isPlus ? (
          <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">PLUS</span>
        ) : (
          <Link to="/upgrade" className="text-xs text-muted-foreground hover:text-primary">
            {remaining} swipes left
          </Link>
        )}
      </header>

      <div className="px-5">
        {loading && <SkeletonCard />}
        {!loading && limitReached && <LimitReached />}
        {!loading && !limitReached && !current && <EmptyDeck />}
        {!limitReached && current && (
          <CardView profile={current} photoIdx={photoIdx} setPhotoIdx={setPhotoIdx} onSwipe={swipe} />
        )}
      </div>
    </AppShell>
  );
}

function LimitReached() {
  return (
    <div className="mt-12 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-primary"><Lock className="h-7 w-7" /></div>
      <h2 className="font-display text-2xl font-bold">Out of swipes today</h2>
      <p className="mt-2 text-sm text-muted-foreground">Upgrade to Senda Plus for unlimited swipes.</p>
      <Link to="/upgrade" className="mt-5 inline-block rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/30">
        Get Senda Plus
      </Link>
    </div>
  );
}

function CardView({ profile, photoIdx, setPhotoIdx, onSwipe }: {
  profile: Profile; photoIdx: number; setPhotoIdx: (n: number) => void; onSwipe: (d: "like" | "pass") => void;
}) {
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  useEffect(() => {
    (async () => {
      if (!profile.photos.length) { setPhotoUrls([]); return; }
      const results = await Promise.all(profile.photos.map((p) =>
        supabase.storage.from("profile-photos").createSignedUrl(p, 3600)
      ));
      setPhotoUrls(results.map((r) => r.data?.signedUrl || ""));
    })();
  }, [profile.id]);

  const age = ageFromDob(profile.date_of_birth);
  const loc = [profile.location_city, profile.location_country].filter(Boolean).join(", ");
  const photoCount = photoUrls.length || 1;

  return (
    <div>
      <div className="swipe-card-shadow relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-muted">
        {photoUrls[photoIdx] ? (
          <img src={photoUrls[photoIdx]} alt={profile.display_name || ""} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground">No photo</div>
        )}

        {photoUrls.length > 1 && (
          <>
            <div className="absolute left-3 right-3 top-3 flex gap-1">
              {photoUrls.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full ${i === photoIdx ? "bg-white" : "bg-white/30"}`} />
              ))}
            </div>
            <button onClick={() => setPhotoIdx(Math.max(0, photoIdx - 1))} className="absolute inset-y-0 left-0 w-1/3" />
            <button onClick={() => setPhotoIdx(Math.min(photoCount - 1, photoIdx + 1))} className="absolute inset-y-0 right-0 w-1/3" />
          </>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-5 text-white">
          <h2 className="font-display text-3xl font-bold">
            {profile.display_name}{age && <span className="font-sans text-2xl font-normal">, {age}</span>}
          </h2>
          {loc && <p className="mt-1 flex items-center gap-1 text-sm text-white/80"><MapPin className="h-3.5 w-3.5" />{loc}{profile.willing_to_travel && " · ✈️ travels"}</p>}
          {profile.niches.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.niches.slice(0, 4).map((n) => <span key={n} className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs backdrop-blur">{n}</span>)}
            </div>
          )}
        </div>
      </div>

      {profile.bio && <p className="mt-4 text-sm text-muted-foreground">{profile.bio}</p>}

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        {profile.experience_years != null && <Stat icon={<Sparkles className="h-3 w-3" />} label={`${profile.experience_years}y in industry`} />}
        <Stat icon={<Flame className="h-3 w-3" />} label={`${profile.completed_collabs} collabs`} />
      </div>

      <div className="mt-6 flex items-center justify-center gap-6">
        <button onClick={() => onSwipe("pass")} className="grid h-16 w-16 place-items-center rounded-full border-2 border-border bg-card text-muted-foreground transition hover:scale-105 hover:border-destructive hover:text-destructive">
          <X className="h-7 w-7" />
        </button>
        <button onClick={() => onSwipe("like")} className="grid h-20 w-20 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 transition hover:scale-105">
          <Heart className="h-9 w-9 fill-current" />
        </button>
      </div>
    </div>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1">{icon}{label}</span>;
}

function EmptyDeck() {
  return (
    <div className="mt-12 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-primary"><Flame className="h-7 w-7" /></div>
      <h2 className="font-display text-2xl font-bold">You're all caught up</h2>
      <p className="mt-2 text-sm text-muted-foreground">New creators join every day. Check back soon.</p>
    </div>
  );
}

function SkeletonCard() {
  return <div className="aspect-[3/4] w-full animate-pulse rounded-3xl bg-card" />;
}
