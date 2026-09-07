import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { BillingCheckout } from "@/components/BillingCheckout";
import { useSubscription } from "@/hooks/useSubscription";
import { createPortalSession } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { capabilities } from "@/lib/billing/config";
import { COUPON_LAUNCH_20PCT, trialCouponFor } from "@/lib/senda";

import { ArrowLeft, Check, Flame, Sparkles, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/upgrade")({
  head: () => ({ meta: [{ title: "Senda Plus & Premium — Upgrade" }] }),
  component: UpgradePage,
});

type PlanKey = "plus" | "premium";
type OfferKind = "launch" | "trial" | null;

const OFFER_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 hours
const OFFER_KEY = "senda_offer_deadline";

const PLANS: Record<PlanKey, {
  name: string;
  tagline: string;
  price: number;
  priceLabel: string;
  perks: string[];
  gradient: string;
  icon: typeof Flame;
}> = {
  plus: {
    name: "Senda Plus",
    tagline: "For active creators",
    price: 11.99,
    priceLabel: "£11.99",
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
    price: 24.99,
    priceLabel: "£24.99",
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

function gbp(n: number): string {
  return `£${n.toFixed(2)}`;
}

function useCountdownOffer() {
  const [deadline, setDeadline] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let stored = localStorage.getItem(OFFER_KEY);
    if (!stored) {
      const dl = Date.now() + OFFER_WINDOW_MS;
      localStorage.setItem(OFFER_KEY, String(dl));
      stored = String(dl);
    }
    setDeadline(Number(stored));
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = deadline ? deadline - now : 0;
  const active = remaining > 0;
  const hours = Math.max(0, Math.floor(remaining / 3600000));
  const minutes = Math.max(0, Math.floor((remaining % 3600000) / 60000));
  const seconds = Math.max(0, Math.floor((remaining % 60000) / 1000));
  return { active, hours, minutes, seconds };
}

function UpgradePage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<{ id: string; email?: string } | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanKey | null>(null);
  const [checkoutOffer, setCheckoutOffer] = useState<OfferKind>(null);
  const { subscription, isActive, tier, isAmbassador } = useSubscription(me?.id);
  const offer = useCountdownOffer();

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

  const couponId = checkoutPlan
    ? checkoutOffer === "launch"
      ? COUPON_LAUNCH_20PCT
      : checkoutOffer === "trial"
        ? trialCouponFor(checkoutPlan)
        : undefined
    : undefined;

  if (checkoutPlan && me) {
    const plan = PLANS[checkoutPlan];
    const offerLabel =
      checkoutOffer === "launch" ? "20% off your first month"
      : checkoutOffer === "trial" ? "£1 first month"
      : null;
    const introPrice =
      checkoutOffer === "launch" ? gbp(plan.price * 0.8)
      : checkoutOffer === "trial" ? "£1.00"
      : plan.priceLabel;
    return (
      <AppShell>
        <PaymentTestModeBanner />
        <div className="px-5 pt-4">
          <button onClick={() => { setCheckoutPlan(null); setCheckoutOffer(null); }} className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />Back
          </button>
          <h2 className="mb-1 font-display text-2xl font-bold">{plan.name}</h2>
          {offerLabel ? (
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm text-muted-foreground line-through">{plan.priceLabel}</span>
              <span className="text-lg font-bold text-primary">{introPrice}</span>
              <span className="text-xs text-muted-foreground">first month, then {plan.priceLabel}/month</span>
            </div>
          ) : (
            <p className="mb-3 text-sm text-muted-foreground">{plan.priceLabel}/month</p>
          )}
          <BillingCheckout
            product={checkoutPlan}
            userId={me.id}
            customerEmail={me.email}
            returnUrl={`${window.location.origin}/upgrade?status=success`}
            couponId={couponId}
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

        {/* Launch offer countdown banner */}
        {offer.active && (
          <div className="mt-4 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/15 to-amber-500/10 p-4">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 shrink-0 text-primary" />
              <div className="flex-1">
                <div className="text-sm font-bold">Launch offer — 20% off your first month</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Ends in{" "}
                  <span className="font-mono font-semibold text-primary">
                    {String(offer.hours).padStart(2, "0")}:{String(offer.minutes).padStart(2, "0")}:{String(offer.seconds).padStart(2, "0")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

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
            {capabilities().customerPortal ? (
              <button onClick={openPortal} className="mt-3 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold">
                Manage subscription
              </button>
            ) : (
              <a href="/billing" className="mt-3 inline-block rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold">
                Cancel or manage billing
              </a>
            )}
          </div>
        )}

        <div className="mt-6 space-y-4">
          {(Object.keys(PLANS) as PlanKey[]).map((key) => {
            const plan = PLANS[key];
            const Icon = plan.icon;
            const current = tier === key;
            const discountedLabel = offer.active ? gbp(plan.price * 0.8) : null;
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
                  <div className="mt-3">
                    {discountedLabel ? (
                      <>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm opacity-60 line-through">{plan.priceLabel}</span>
                          <span className="font-display text-4xl font-bold">{discountedLabel}</span>
                          <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase">20% off</span>
                        </div>
                        <div className="mt-0.5 text-xs opacity-80">
                          first month, then {plan.priceLabel}/month
                        </div>
                      </>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="font-display text-4xl font-bold">{plan.priceLabel}</span>
                        <span className="opacity-80 text-sm">/month</span>
                      </div>
                    )}
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
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setCheckoutPlan(key);
                          setCheckoutOffer(offer.active ? "launch" : null);
                        }}
                        className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/30"
                      >
                        {offer.active
                          ? `Get ${plan.name} — 20% off`
                          : isActive ? `Switch to ${plan.name}` : `Get ${plan.name}`}
                      </button>
                      <button
                        onClick={() => {
                          setCheckoutPlan(key);
                          setCheckoutOffer("trial");
                        }}
                        className="w-full rounded-full border border-primary/40 bg-primary/5 py-2.5 text-sm font-semibold text-primary"
                      >
                        Try for £1 first month
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Monthly, renews until cancelled. Cancel anytime. Tax included.{" "}
          <a href="/billing" className="underline">Billing & refund terms</a>
        </p>

      </div>
    </AppShell>
  );
}
