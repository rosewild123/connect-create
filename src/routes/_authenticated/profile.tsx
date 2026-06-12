import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert, LogOut, Pencil, Sparkles, Loader2, Zap, Lock, Gift } from "lucide-react";
import { ageFromDob, type Platform, BOOSTS_PLUS_MONTHLY, BOOSTS_PREMIUM_MONTHLY, BOOST_DURATION_MIN } from "@/lib/senda";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { startIdentityVerification, refreshIdentityVerification } from "@/lib/verification.functions";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { NotificationsToggle } from "@/components/NotificationsToggle";
import { PromptsEditor } from "@/components/PromptsEditor";
import type { Prompt } from "@/lib/prompts";
import { getStripeEnvironment } from "@/lib/stripe";


export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Senda" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{
    id: string; display_name: string | null; bio: string | null; date_of_birth: string | null;
    location_city: string | null; location_country: string | null;
    niches: string[]; looking_for: string[]; platforms: Platform[]; photos: string[];
    age_verified: boolean; id_verified: boolean; photo_verified: boolean; experience_years: number | null; completed_collabs: number;
    prompts: Prompt[];
  } | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => { (async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data: rpcData } = await supabase.rpc("get_my_profile");
    const data = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    if (data) {
      setProfile(data as unknown as typeof profile);
      if (data.photos?.[0]) {
        const { data: s } = await supabase.storage.from("profile-photos").createSignedUrl(data.photos[0], 3600);
        if (s) setPhotoUrl(s.signedUrl);
      }
    }
  })(); }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
    toast.success("Signed out");
  }

  if (!profile) return <AppShell><div className="p-6 text-muted-foreground">Loading...</div></AppShell>;
  const age = ageFromDob(profile.date_of_birth);

  return (
    <AppShell>
      <header className="flex items-center justify-between px-5 py-4">
        <h1 className="font-display text-3xl font-bold">Profile</h1>
        <button onClick={signOut} className="text-muted-foreground hover:text-foreground"><LogOut className="h-5 w-5" /></button>
      </header>

      <div className="px-5">
        <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-muted">
          {photoUrl && <img src={photoUrl} alt="" className="h-full w-full object-cover" />}
          <Link to="/onboarding" className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur">
            <Pencil className="h-4 w-4" />
          </Link>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-5 text-white">
            <h2 className="flex items-center gap-1.5 font-display text-2xl font-bold">
              {profile.display_name}{age && `, ${age}`}
              {profile.photo_verified && <VerifiedBadge className="h-5 w-5" />}
            </h2>
            {[profile.location_city, profile.location_country].filter(Boolean).length > 0 && (
              <p className="text-sm text-white/80">{[profile.location_city, profile.location_country].filter(Boolean).join(", ")}</p>
            )}
          </div>
        </div>

        <Link to="/upgrade" className="mt-4 flex items-center gap-3 rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 to-transparent p-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-display font-bold">Senda Plus</div>
            <p className="text-xs text-muted-foreground">Unlimited swipes, see who liked you, undo</p>
          </div>
          <span className="text-xs font-semibold text-primary">Upgrade →</span>
        </Link>

        <Link to="/referrals" className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
            <Gift className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-display font-bold">Invite & upgrade free</div>
            <p className="text-xs text-muted-foreground">1 month of Senda Plus free for you and every friend who joins.</p>
          </div>
          <span className="text-xs font-semibold text-primary">Share →</span>
        </Link>

        <div className="mt-4 space-y-3">
          <BoostCard userId={profile.id} />
          <NotificationsToggle />
          <PromptsEditor userId={profile.id} initial={profile.prompts ?? []} />
          {!(profile.age_verified || profile.id_verified) && (
            <VerificationCard
              ageVerified={profile.age_verified}
              idVerified={profile.id_verified}
            />
          )}

        </div>

        {profile.bio && <p className="mt-5 text-sm text-muted-foreground">{profile.bio}</p>}

        {profile.niches.length > 0 && (
          <div className="mt-5">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Niches</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.niches.map((n) => <span key={n} className="rounded-full bg-card border border-border px-3 py-1 text-sm">{n}</span>)}
            </div>
          </div>
        )}

        {profile.platforms.length > 0 && (
          <div className="mt-5">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Platforms</h3>
            <ul className="mt-2 space-y-2">
              {profile.platforms.map((p, i) => (
                <li key={i} className="rounded-xl border border-border bg-card px-3 py-2 text-sm">
                  <div className="font-medium">{p.platform}</div>
                  <a href={p.url} target="_blank" rel="noreferrer" className="text-xs text-primary">{p.url}</a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button asChild variant="outline" className="mt-6 w-full rounded-full">
          <Link to="/onboarding">Edit profile</Link>
        </Button>
        <Button asChild variant="ghost" className="mt-2 w-full rounded-full">
          <Link to="/safety">Safety center</Link>
        </Button>
        <Button asChild variant="ghost" className="mt-2 w-full rounded-full">
          <Link to="/blocked">Blocked users</Link>
        </Button>
        <Button asChild variant="ghost" className="mt-2 w-full rounded-full">
          <Link to="/settings">Settings & account</Link>
        </Button>
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
        </div>
      </div>
    </AppShell>
  );
}

function VerificationCard({ ageVerified, idVerified }: { ageVerified: boolean; idVerified: boolean }) {
  const startVerify = useServerFn(startIdentityVerification);
  const [loading, setLoading] = useState(false);
  const verified = ageVerified || idVerified;

  async function handleVerify() {
    setLoading(true);
    try {
      const result = await startVerify({
        data: {
          returnUrl: `${window.location.origin}/profile`,
          environment: getStripeEnvironment(),
        },
      });
      if ("error" in result) {
        const friendly = /identity/i.test(result.error) && /not set up|invalid_application|identity_api/i.test(result.error)
          ? "Verification isn't available yet — we're finishing setup. Please check back soon."
          : result.error;
        toast.error(friendly);
        setLoading(false);
        return;
      }
      window.location.href = result.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start verification");
      setLoading(false);
    }
  }

  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 ${verified ? "border-primary/50 bg-primary/5" : "border-border bg-card"}`}>
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${verified ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
        {verified ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
      </div>
      <div className="flex-1">
        <div className="font-semibold">
          Identity & age verification
          {idVerified && <span className="ml-2 text-xs text-primary">Verified</span>}
        </div>
        <p className="text-xs text-muted-foreground">
          Confirm you're 18+ with a government ID and a selfie. Takes about a minute.
        </p>
        {!idVerified && (
          <button
            onClick={handleVerify}
            disabled={loading}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary disabled:opacity-60"
          >
            {loading && <Loader2 className="h-3 w-3 animate-spin" />}
            {loading ? "Opening…" : "Verify now →"}
          </button>
        )}
      </div>
    </div>
  );
}

function BoostCard({ userId }: { userId: string }) {
  const { isActive: isPlus, isPremium } = useSubscription(userId);
  const [used, setUsed] = useState(0);
  const [endsAt, setEndsAt] = useState<Date | null>(null);
  const [activating, setActivating] = useState(false);
  const [, setTick] = useState(0);

  async function refresh() {
    const [b, e] = await Promise.all([
      supabase.rpc("boosts_this_month"),
      supabase.rpc("active_boost_ends_at", { _user_id: userId }),
    ]);
    setUsed((b.data as unknown as number) ?? 0);
    setEndsAt(e.data ? new Date(e.data as unknown as string) : null);
  }
  useEffect(() => { refresh(); }, [userId]);
  useEffect(() => {
    if (!endsAt) return;
    const i = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, [endsAt]);

  const active = !!endsAt && endsAt.getTime() > Date.now();
  const quota = isPremium ? BOOSTS_PREMIUM_MONTHLY : BOOSTS_PLUS_MONTHLY;
  const remaining = Math.max(0, quota - used);

  async function activate() {
    if (!isPlus) { toast.info("Boosts are a Plus feature."); return; }
    if (remaining <= 0) { toast.info("You've used this month's boost."); return; }
    setActivating(true);
    
    const { data, error } = await supabase.rpc("activate_boost", { _duration_minutes: BOOST_DURATION_MIN });
    setActivating(false);
    const res = (data ?? {}) as { ok?: boolean; error?: string };
    if (error || !res.ok) { toast.error(error?.message || res.error || "Failed"); return; }
    toast.success(`Boosted for ${BOOST_DURATION_MIN} minutes ⚡`);
    refresh();
  }

  function fmt(d: Date) {
    const s = Math.max(0, Math.floor((d.getTime() - Date.now()) / 1000));
    const m = Math.floor(s / 60); const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-4 ${active ? "border-primary/50 bg-primary/5" : "border-border bg-card"}`}>
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
        <Zap className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="font-semibold">
          Boost {active && <span className="ml-2 text-xs text-primary">Active · {endsAt && fmt(endsAt)}</span>}
        </div>
        <p className="text-xs text-muted-foreground">
          {isPlus
            ? `Move to the front of the deck for ${BOOST_DURATION_MIN} min. ${remaining} of ${quota} left this month.`
            : "Plus members get 1 boost per month. Upgrade to unlock."}
        </p>
        {isPlus ? (
          <button
            onClick={activate}
            disabled={activating || active || remaining <= 0}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
          >
            {active
              ? <>Boost active · {endsAt && fmt(endsAt)}</>
              : remaining <= 0
                ? "No boosts left this month"
                : activating
                  ? <><Loader2 className="h-3 w-3 animate-spin" /> Activating…</>
                  : <><Zap className="h-3 w-3" /> Boost now</>}
          </button>
        ) : (
          <Link to="/upgrade" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">
            <Lock className="h-3 w-3" /> Unlock with Plus →
          </Link>
        )}
      </div>
    </div>
  );
}
