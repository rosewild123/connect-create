import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Heart, X, MapPin, Flame, Sparkles, Lock, SlidersHorizontal, Undo2, Star, Zap } from "lucide-react";
import { ageFromDob, type Platform, NICHES, LOOKING_FOR, SUPER_LIKES_FREE_DAILY, SUPER_LIKES_PLUS_DAILY, SUPER_LIKES_PREMIUM_DAILY } from "@/lib/senda";
import { useSubscription, FREE_DAILY_SWIPES } from "@/hooks/useSubscription";
import { toast } from "sonner";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ReportBlockMenu } from "@/components/ReportBlockMenu";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useHiddenUserIds } from "@/hooks/useBlocks";
import { notifyPotentialMatch } from "@/lib/push.functions";

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
  photo_verified: boolean;
  prompts: { q: string; a: string }[] | null;
};

type Filters = {
  niches: string[];
  lookingFor: string[];
  country: string;
  travelOnly: boolean;
  ageMin: number;
  ageMax: number;
  minExperience: number;
  verifiedOnly: boolean;
};

const DEFAULT_FILTERS: Filters = {
  niches: [],
  lookingFor: [],
  country: "",
  travelOnly: false,
  ageMin: 18,
  ageMax: 88,
  minExperience: 0,
  verifiedOnly: false,
};

const STORAGE_KEY = "senda.discover.filters";

function loadFilters(): Filters {
  if (typeof window === "undefined") return DEFAULT_FILTERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FILTERS;
    return { ...DEFAULT_FILTERS, ...JSON.parse(raw) };
  } catch { return DEFAULT_FILTERS; }
}

function Discover() {
  const navigate = useNavigate();
  const [me, setMe] = useState<string | null>(null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [swipesToday, setSwipesToday] = useState(0);
  const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [lastSwipe, setLastSwipe] = useState<{ id: string; dir: "like" | "pass"; profile: Profile } | null>(null);
  const [likesYouCount, setLikesYouCount] = useState(0);
  const [superLikesUsed, setSuperLikesUsed] = useState(0);
  const [boostedIds, setBoostedIds] = useState<Set<string>>(new Set());
  const { isActive: isPlus, isPremium } = useSubscription(me);
  const { hidden, refresh: refreshHidden } = useHiddenUserIds(me);
  const superLikeQuota = isPremium ? SUPER_LIKES_PREMIUM_DAILY : isPlus ? SUPER_LIKES_PLUS_DAILY : SUPER_LIKES_FREE_DAILY;
  const superLikesLeft = Math.max(0, superLikeQuota - superLikesUsed);

  const limitReached = !isPlus && swipesToday >= FREE_DAILY_SWIPES;
  const remaining = Math.max(0, FREE_DAILY_SWIPES - swipesToday);

  useEffect(() => { setFilters(loadFilters()); }, []);

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
    const swiped = new Set(swipes?.map((s) => s.swipee_id) || []);
    swiped.add(u.user.id);
    setSwipedIds(swiped);

    const { data: profs, error } = await supabase
      .from("profiles").select("*").eq("is_onboarded", true).limit(200);
    if (error) toast.error(error.message);
    setAllProfiles((profs || []) as unknown as Profile[]);

    const { count: likesCount } = await supabase.from("swipes")
      .select("id", { count: "exact", head: true })
      .eq("swipee_id", u.user.id).in("direction", ["like", "super"]);
    setLikesYouCount(likesCount ?? 0);

    const { data: sl } = await supabase.rpc("super_likes_today");
    setSuperLikesUsed((sl as unknown as number) ?? 0);

    const { data: boosted } = await supabase.rpc("boosted_user_ids");
    setBoostedIds(new Set<string>((boosted as unknown as string[]) || []));

    setLoading(false);
  })(); }, [navigate]);

  const deck = useMemo(() => {
    const filtered = allProfiles.filter((p) => {
      if (swipedIds.has(p.id)) return false;
      if (hidden.has(p.id)) return false;
      const age = ageFromDob(p.date_of_birth);
      if (age != null && (age < filters.ageMin || age > filters.ageMax)) return false;
      if (filters.country.trim() && !(p.location_country || "").toLowerCase().includes(filters.country.trim().toLowerCase())) return false;
      if (filters.travelOnly && !p.willing_to_travel) return false;
      if (filters.minExperience > 0 && (p.experience_years ?? 0) < filters.minExperience) return false;
      if (filters.niches.length && !filters.niches.some((n) => p.niches?.includes(n))) return false;
      if (filters.lookingFor.length && !filters.lookingFor.some((l) => p.looking_for?.includes(l))) return false;
      if (filters.verifiedOnly && !p.photo_verified) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      const ab = boostedIds.has(a.id) ? 1 : 0;
      const bb = boostedIds.has(b.id) ? 1 : 0;
      return bb - ab;
    });
  }, [allProfiles, swipedIds, hidden, filters, boostedIds]);

  const current = deck[0];
  const activeFilterCount = countActive(filters);

  async function swipe(dir: "like" | "pass" | "super") {
    if (!current || !me) return;
    if (dir === "super") {
      if (superLikesLeft <= 0) {
        if (!isPlus) { toast.info("Out of super likes today. Upgrade for more."); navigate({ to: "/upgrade" }); return; }
        toast.info("You've used all your super likes today.");
        return;
      }
    } else if (limitReached) { navigate({ to: "/upgrade" }); return; }
    const target = current;
    setSwipedIds((prev) => { const next = new Set(prev); next.add(target.id); return next; });
    setPhotoIdx(0);
    setSwipesToday((n) => n + 1);
    if (dir === "super") setSuperLikesUsed((n) => n + 1);
    setLastSwipe({ id: target.id, dir: dir === "super" ? "like" : dir, profile: target });
    const { error } = await supabase.from("swipes").insert({ swiper_id: me, swipee_id: target.id, direction: dir });
    if (error) { toast.error(error.message); return; }
    if (dir === "like" || dir === "super") {
      const { data: m } = await supabase.from("matches").select("id")
        .or(`and(user_a.eq.${me},user_b.eq.${target.id}),and(user_a.eq.${target.id},user_b.eq.${me})`)
        .maybeSingle();
      if (m) {
        toast.success(`It's a match with ${target.display_name}! 🔥`, {
          action: { label: "Message", onClick: () => navigate({ to: "/matches/$id", params: { id: m.id } }) },
        });
        notifyPotentialMatch({ data: { swipeeId: target.id } }).catch(() => {});
      } else if (dir === "super") {
        toast.success(`⭐ Super liked ${target.display_name}`);
      }
    }
  }

  async function undo() {
    if (!lastSwipe || !me) return;
    if (!isPlus) { navigate({ to: "/upgrade" }); return; }
    const { id } = lastSwipe;
    const { error } = await supabase.from("swipes").delete()
      .eq("swiper_id", me).eq("swipee_id", id);
    if (error) { toast.error(error.message); return; }
    setSwipedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    setSwipesToday((n) => Math.max(0, n - 1));
    setLastSwipe(null);
    toast.success("Swipe undone");
  }

  return (
    <AppShell>
      <header className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-display text-lg font-bold">s</div>
          <span className="font-display text-xl font-bold">senda</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/likes" className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-foreground hover:bg-accent" aria-label="Likes you">
            <Heart className="h-4 w-4" />
            {isPlus && likesYouCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {likesYouCount > 99 ? "99+" : likesYouCount}
              </span>
            )}
            {!isPlus && (
              <span className="absolute -right-1 -top-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-primary text-primary-foreground">
                <Lock className="h-2 w-2" />
              </span>
            )}
          </Link>
          <FiltersSheet filters={filters} setFilters={setFilters} activeCount={activeFilterCount} />
          {isPlus ? (
            <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">PLUS</span>
          ) : (
            <Link to="/upgrade" className="text-xs text-muted-foreground hover:text-primary">
              {remaining} left
            </Link>
          )}
        </div>
      </header>


      <div className="px-5">
        {loading && <SkeletonCard />}
        {!loading && limitReached && <LimitReached />}
        {!loading && !limitReached && !current && (
          activeFilterCount > 0
            ? <EmptyDeck title="No matches with these filters" subtitle="Try loosening your filters to see more creators." onReset={() => { setFilters(DEFAULT_FILTERS); localStorage.removeItem(STORAGE_KEY); }} />
            : <EmptyDeck title="You're all caught up" subtitle="New creators join every day. Check back soon." />
        )}
        {!limitReached && current && (
          <CardView profile={current} photoIdx={photoIdx} setPhotoIdx={setPhotoIdx} onSwipe={swipe}
            onUndo={lastSwipe ? undo : undefined} isPlus={isPlus} onBlocked={refreshHidden}
            isBoosted={boostedIds.has(current.id)} superLikesLeft={superLikesLeft} />
        )}
      </div>
    </AppShell>
  );
}

function countActive(f: Filters): number {
  let n = 0;
  if (f.niches.length) n++;
  if (f.lookingFor.length) n++;
  if (f.country.trim()) n++;
  if (f.travelOnly) n++;
  if (f.ageMin !== 18 || f.ageMax !== 88) n++;
  if (f.minExperience > 0) n++;
  if (f.verifiedOnly) n++;
  return n;
}

function FiltersSheet({ filters, setFilters, activeCount }: {
  filters: Filters; setFilters: (f: Filters) => void; activeCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Filters>(filters);
  useEffect(() => { if (open) setDraft(filters); }, [open, filters]);

  function apply() {
    setFilters(draft);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setOpen(false);
  }
  function reset() {
    setDraft(DEFAULT_FILTERS);
  }
  function toggle(arr: string[], v: string): string[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-foreground hover:bg-accent">
          <SlidersHorizontal className="h-4 w-4" />
          {activeCount > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Filters</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-6 pb-4">
          <section>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Niches</Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {NICHES.map((n) => {
                const active = draft.niches.includes(n);
                return (
                  <button key={n} type="button" onClick={() => setDraft({ ...draft, niches: toggle(draft.niches, n) })}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"}`}>
                    {n}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Looking for</Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {LOOKING_FOR.map((l) => {
                const active = draft.lookingFor.includes(l.id);
                return (
                  <button key={l.id} type="button" onClick={() => setDraft({ ...draft, lookingFor: toggle(draft.lookingFor, l.id) })}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"}`}>
                    {l.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <Label htmlFor="country" className="text-xs uppercase tracking-widest text-muted-foreground">Country</Label>
            <Input id="country" value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })}
              placeholder="e.g. United States" className="mt-2" />
          </section>

          <section className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Willing to travel only</div>
              <p className="text-xs text-muted-foreground">Hide creators not open to travel</p>
            </div>
            <Switch checked={draft.travelOnly} onCheckedChange={(v) => setDraft({ ...draft, travelOnly: v })} />
          </section>

          <section className="flex items-center justify-between">
            <div>
              <div className="font-semibold flex items-center gap-1">Verified only <VerifiedBadge className="h-4 w-4" /></div>
              <p className="text-xs text-muted-foreground">Show only photo-verified creators</p>
            </div>
            <Switch checked={draft.verifiedOnly} onCheckedChange={(v) => setDraft({ ...draft, verifiedOnly: v })} />
          </section>

          <section>
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Age range</Label>
              <span className="text-sm font-medium">{draft.ageMin} – {draft.ageMax}</span>
            </div>
            <Slider min={18} max={88} step={1} value={[draft.ageMin, draft.ageMax]}
              onValueChange={(v) => setDraft({ ...draft, ageMin: v[0], ageMax: v[1] })} className="mt-3" />
          </section>

          <section>
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Min experience</Label>
              <span className="text-sm font-medium">{draft.minExperience === 0 ? "Any" : `${draft.minExperience}y+`}</span>
            </div>
            <Slider min={0} max={15} step={1} value={[draft.minExperience]}
              onValueChange={(v) => setDraft({ ...draft, minExperience: v[0] })} className="mt-3" />
          </section>
        </div>

        <SheetFooter className="flex-row gap-2 sm:justify-stretch">
          <Button variant="outline" onClick={reset} className="flex-1 rounded-full">Reset</Button>
          <Button onClick={apply} className="flex-1 rounded-full">Apply</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
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

function CardView({ profile, photoIdx, setPhotoIdx, onSwipe, onUndo, isPlus, onBlocked, isBoosted, superLikesLeft }: {
  profile: Profile; photoIdx: number; setPhotoIdx: (n: number) => void;
  onSwipe: (d: "like" | "pass" | "super") => void; onUndo?: () => void; isPlus: boolean;
  onBlocked?: () => void; isBoosted?: boolean; superLikesLeft: number;
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

        <div className="absolute right-3 top-3 z-10">
          <ReportBlockMenu targetId={profile.id} targetName={profile.display_name} onBlocked={onBlocked} variant="overlay" />
        </div>

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
          <h2 className="flex items-center gap-1.5 font-display text-3xl font-bold">
            {profile.display_name}{age && <span className="font-sans text-2xl font-normal">, {age}</span>}
            {profile.photo_verified && <VerifiedBadge className="h-6 w-6" />}
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

      {profile.prompts && profile.prompts.length > 0 && (
        <ul className="mt-4 space-y-2">
          {profile.prompts.map((p, i) => (
            <li key={i} className="rounded-2xl border border-border bg-card p-3">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{p.q}</div>
              <p className="mt-1 text-sm">{p.a}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        {profile.experience_years != null && <Stat icon={<Sparkles className="h-3 w-3" />} label={`${profile.experience_years}y in industry`} />}
        <Stat icon={<Flame className="h-3 w-3" />} label={`${profile.completed_collabs} collabs`} />
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button onClick={onUndo} disabled={!onUndo}
          className="grid h-12 w-12 place-items-center rounded-full border-2 border-border bg-card text-muted-foreground transition hover:scale-105 hover:text-foreground disabled:opacity-40 disabled:hover:scale-100 relative"
          aria-label="Undo last swipe">
          <Undo2 className="h-5 w-5" />
          {!isPlus && <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-primary-foreground"><Lock className="h-2.5 w-2.5" /></span>}
        </button>
        <button onClick={() => onSwipe("pass")} aria-label="Pass" className="grid h-14 w-14 place-items-center rounded-full border-2 border-border bg-card text-muted-foreground transition hover:scale-105 hover:border-destructive hover:text-destructive">
          <X className="h-6 w-6" />
        </button>
        <button onClick={() => onSwipe("super")} aria-label="Super like"
          className="relative grid h-14 w-14 place-items-center rounded-full border-2 border-sky-400 bg-card text-sky-500 transition hover:scale-105 disabled:opacity-40"
          disabled={superLikesLeft <= 0}>
          <Star className="h-6 w-6 fill-current" />
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white">
            {superLikesLeft}
          </span>
        </button>
        <button onClick={() => onSwipe("like")} aria-label="Like" className="grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 transition hover:scale-105">
          <Heart className="h-7 w-7 fill-current" />
        </button>
      </div>

      {isBoosted && (
        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-primary">
          <Zap className="h-3.5 w-3.5 fill-current" /> Boosted profile
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1">{icon}{label}</span>;
}

function EmptyDeck({ title, subtitle, onReset }: { title: string; subtitle: string; onReset?: () => void }) {
  return (
    <div className="mt-12 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-primary"><Flame className="h-7 w-7" /></div>
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      {onReset && (
        <Button variant="outline" className="mt-5 rounded-full" onClick={onReset}>Clear filters</Button>
      )}
    </div>
  );
}

function SkeletonCard() {
  return <div className="aspect-[3/4] w-full animate-pulse rounded-3xl bg-card" />;
}
