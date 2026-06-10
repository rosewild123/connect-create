import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { useSubscription } from "@/hooks/useSubscription";
import { createPortalSession } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { ArrowLeft, Check, Flame, Heart, Eye, Undo2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/upgrade")({
  head: () => ({ meta: [{ title: "Senda Plus — Upgrade" }] }),
  component: UpgradePage,
});

const PERKS = [
  { icon: Heart, label: "Unlimited swipes" },
  { icon: Eye, label: "See who liked you" },
  { icon: Undo2, label: "Undo last swipe" },
  { icon: MessageSquare, label: "Priority placement in discover" },
];

function UpgradePage() {
  const navigate = useNavigate();
  const [me, setMe] = useState<{ id: string; email?: string } | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const { subscription, isActive } = useSubscription(me?.id);

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

  if (showCheckout && me) {
    return (
      <AppShell>
        <PaymentTestModeBanner />
        <div className="px-5 pt-4">
          <button onClick={() => setShowCheckout(false)} className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />Back
          </button>
          <StripeEmbeddedCheckout
            priceId="senda_plus_monthly_gbp"
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

      <div className="px-5">
        <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/60 p-6 text-primary-foreground">
          <div className="text-xs font-semibold uppercase tracking-widest opacity-80">Senda Plus</div>
          <h1 className="mt-1 font-display text-4xl font-bold">Match faster.<br />Collab more.</h1>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="font-display text-5xl font-bold">$14.99</span>
            <span className="opacity-80">/month</span>
          </div>
        </div>

        <ul className="mt-6 space-y-3">
          {PERKS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <span className="flex-1 font-medium">{label}</span>
              <Check className="h-4 w-4 text-primary" />
            </li>
          ))}
        </ul>

        {isActive ? (
          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-center">
              <div className="font-display text-lg font-bold text-primary">You're on Senda Plus 🔥</div>
              {subscription?.current_period_end && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {subscription.cancel_at_period_end ? "Ends" : "Renews"} {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
            <button onClick={openPortal} className="w-full rounded-full border border-border bg-card py-3 font-semibold">
              Manage subscription
            </button>
          </div>
        ) : (
          <button onClick={() => setShowCheckout(true)} className="mt-6 w-full rounded-full bg-primary py-4 font-semibold text-primary-foreground shadow-lg shadow-primary/30">
            Upgrade to Plus
          </button>
        )}

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Cancel anytime. Tax handled automatically.
        </p>
      </div>
    </AppShell>
  );
}
