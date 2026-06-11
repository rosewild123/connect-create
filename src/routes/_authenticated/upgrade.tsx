import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { useSubscription } from "@/hooks/useSubscription";
import { createPortalSession } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { PRICE_PLUS, PRICE_PREMIUM } from "@/lib/senda";
import { ArrowLeft, Check, Flame, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/upgrade")({
  head: () => ({ meta: [{ title: "Senda Plus & Premium — Upgrade" }] }),
  component: UpgradePage,
});

type PlanKey = "plus" | "premium";

const PLANS: Record<PlanKey, {
  name: string;
  tagline: string;
  price: string;
  priceId: string;
  perks: string[];
  gradient: string;
  icon: typeof Flame;
}> = {
  plus: {
    name: "Senda Plus",
    tagline: "For active creators",
    price: "£11.99",
    priceId: PRICE_PLUS,
    gradient: "from-primary to-primary/60",
    icon: Flame,
    perks: [
      "Unlimited swipes",
      "See who liked you",
      "5 super likes per day",
      "1 boost per month",
    ],
  },
  premium: {
    name: "Senda Premium",
    tagline: "Maximum reach",
    price: "£24.99",
    priceId: PRICE_PREMIUM,
    gradient: "from-amber-500 to-pink-500",
    icon: Sparkles,
    perks: [
      "Everything in Plus",
      "Unlimited super likes",
      "4 boosts per month",
      "Priority placement in discover",
    ],
  },
};

function UpgradePage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<{ id: string; email?: string } | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanKey | null>(null);
  const { subscription, isActive, tier, isAmbassador } = useSubscription(me?.id);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) setMe({ id: data.user.id, email: data.user.email ?? undefined });
    })();
  }, []);

  async function openPortal() {
    const result = await createPortalSession({
      data: { environment: getStripeEnvironment(), returnUrl: window.location.href },
    });
    if ("error" in result) { toast.error(result.error); return; }
    window.open(result.url, "_blank");
  }

  if (checkoutPlan && me) {
    const plan = PLANS[checkoutPlan];
    return (
      <AppShell>
        <PaymentTestModeBanner />
        <div className="px-5 pt-4">
          <button onClick={() => setCheckoutPlan(null)} className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />Back
          </button>
          <h2 className="mb-3 font-display text-2xl font-bold">{plan.name}</h2>
          <StripeEmbeddedCheckout
            priceId={plan.priceId}
            userId={me.id}
            customerEmail={me.email}
            returnUrl={`${window.location.origin}/upgrade?status=success`}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PaymentTestModeBanner />
      <header className="flex items-center justify-between px-5 py-4">
        <button onClick={() => navigate({ to: "/discover" })} className="text-muted-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Flame className="h-5 w-5 text-primary" />
      </header>

      <div className="px-5 pb-10">
        <h1 className="font-display text-3xl font-bold">Choose your plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">Match faster. Collab more.</p>

        {isAmbassador && (
          <div className="mt-4 rounded-2xl border border-amber-500/50 bg-gradient-to-br from-amber-500/15 to-pink-500/10 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <div className="font-display text-base font-bold">Senda Ambassador 👑</div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              You have <span className="font-semibold text-foreground">Premium free for life</span>. Thanks for repping Senda.
            </p>
          </div>
        )}

        {isActive && (
          <div className="mt-4 rounded-2xl border border-primary/40 bg-primary/10 p-4">
            <div className="font-display text-base font-bold text-primary">
              You're on Senda {tier === "premium" ? "Premium" : "Plus"} 🔥
            </div>
            {subscription?.current_period_end && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {subscription.cancel_at_period_end ? "Ends" : "Renews"} {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            )}
            <button onClick={openPortal} className="mt-3 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold">
              Manage subscription
            </button>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {(Object.keys(PLANS) as PlanKey[]).map((key) => {
            const plan = PLANS[key];
            const Icon = plan.icon;
            const current = tier === key;
            return (
              <div key={key} className="overflow-hidden rounded-3xl border border-border bg-card">
                <div className={`bg-gradient-to-br ${plan.gradient} p-5 text-primary-foreground`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-widest opacity-80">{plan.tagline}</div>
                      <div className="font-display text-2xl font-bold">{plan.name}</div>
                    </div>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-bold">{plan.price}</span>
                    <span className="opacity-80 text-sm">/month</span>
                  </div>
                </div>
                <ul className="space-y-2 p-5">
                  {plan.perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />{perk}
                    </li>
                  ))}
                </ul>
                <div className="px-5 pb-5">
                  {current ? (
                    <div className="w-full rounded-full border border-primary/40 bg-primary/10 py-3 text-center text-sm font-semibold text-primary">
                      Current plan
                    </div>
                  ) : (
                    <button
                      onClick={() => setCheckoutPlan(key)}
                      className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/30"
                    >
                      {isActive ? `Switch to ${plan.name}` : `Get ${plan.name}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Cancel anytime. Tax handled automatically.
        </p>
      </div>
    </AppShell>
  );
}
