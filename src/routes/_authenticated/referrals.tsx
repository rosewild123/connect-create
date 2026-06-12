import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Copy, Gift, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/referrals")({
  head: () => ({ meta: [{ title: "Invite & upgrade free — Senda" }] }),
  component: ReferralsPage,
});

type Referral = { id: string; referred_user_id: string; created_at: string; reward_days: number };

function ReferralsPage() {
  const [code, setCode] = useState<string | null>(null);
  const [plusUntil, setPlusUntil] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const [p, r] = await Promise.all([
      supabase.rpc("get_my_profile"),
      supabase.from("referrals").select("id, referred_user_id, created_at, reward_days").eq("referrer_id", u.user.id).order("created_at", { ascending: false }),
    ]);
    const prof = (Array.isArray(p.data) ? p.data[0] : p.data) as { referral_code: string | null; plus_until: string | null } | null;
    setCode(prof?.referral_code ?? null);
    setPlusUntil(prof?.plus_until ?? null);
    setReferrals((r.data as Referral[]) ?? []);
    setLoading(false);
  })(); }, []);

  const link = code ? `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${code}` : "";
  const totalDays = referrals.reduce((s, r) => s + (r.reward_days ?? 30), 0);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied!");
    } catch {
      toast.error("Could not copy");
    }
  }

  async function share() {
    const text = `Join me on Senda — the collab network for creators. Use my link and we both get 1 month of Senda Plus free.`;
    if (typeof navigator !== "undefined" && (navigator as Navigator & { share?: (d: ShareData) => Promise<void> }).share) {
      try { await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share({ title: "Senda", text, url: link }); } catch { /* cancelled */ }
    } else {
      copy(link);
    }
  }

  return (
    <AppShell>
      <header className="flex items-center gap-3 px-5 py-4">
        <Link to="/profile" aria-label="Back"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="font-display text-2xl font-bold">Invite & upgrade free</h1>
      </header>

      <div className="space-y-4 px-5 pb-10">
        <section className="rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/15 to-transparent p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Give 1 month, get 1 month</h2>
              <p className="text-xs text-muted-foreground">
                When a friend signs up with your link, you both get <span className="text-foreground font-semibold">30 days of Senda Plus, free.</span> Stacks with every referral.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Your invite link</div>
          {loading ? (
            <div className="mt-3 h-10 animate-pulse rounded-xl bg-muted" />
          ) : (
            <>
              <div className="mt-2 flex gap-2">
                <Input readOnly value={link} className="rounded-xl text-xs" onFocus={(e) => e.currentTarget.select()} />
                <Button onClick={() => copy(link)} variant="outline" size="icon" className="shrink-0 rounded-xl">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">Code: <span className="font-mono font-semibold text-foreground">{code}</span></div>
                <button onClick={() => code && copy(code)} className="text-xs text-primary">Copy code</button>
              </div>
              <Button onClick={share} className="mt-3 w-full rounded-full">
                <Share2 className="h-4 w-4" /> Share invite
              </Button>
            </>
          )}
        </section>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Friends joined</div>
            <div className="mt-1 font-display text-3xl font-bold">{referrals.length}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Days earned</div>
            <div className="mt-1 font-display text-3xl font-bold">{totalDays}</div>
          </div>
        </div>

        {plusUntil && new Date(plusUntil) > new Date() && (
          <div className="flex items-start gap-3 rounded-2xl border border-primary/40 bg-primary/5 p-4">
            <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
            <div className="text-xs">
              <div className="font-semibold text-foreground">Free Plus active</div>
              <div className="text-muted-foreground">Until {new Date(plusUntil).toLocaleDateString()}</div>
            </div>
          </div>
        )}

        <section>
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground">How it works</h3>
          <ol className="mt-2 space-y-2 text-sm text-muted-foreground">
            <li><span className="font-semibold text-foreground">1.</span> Share your link with creator friends.</li>
            <li><span className="font-semibold text-foreground">2.</span> They sign up and create their account.</li>
            <li><span className="font-semibold text-foreground">3.</span> You both unlock 30 days of Senda Plus — instantly.</li>
          </ol>
        </section>
      </div>
    </AppShell>
  );
}
