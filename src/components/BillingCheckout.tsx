import { useEffect, useState } from "react";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { ACTIVE_BILLING_PROVIDER, providerPriceId } from "@/lib/billing/config";
import type { BillingProduct } from "@/lib/billing/types";
import { createCcbillCheckout } from "@/lib/billing/ccbill.functions";

interface Props {
  product: BillingProduct;
  userId: string;
  customerEmail?: string;
  returnUrl: string;
}

/**
 * Provider-agnostic checkout surface: renders Stripe's embedded checkout, or
 * hands off to the active processor's hosted payment page.
 */
export function BillingCheckout({ product, userId, customerEmail, returnUrl }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (ACTIVE_BILLING_PROVIDER === "stripe") return;
    let cancelled = false;
    (async () => {
      setRedirecting(true);
      const result = await createCcbillCheckout({
        data: { product, returnUrl, customerEmail },
      });
      if (cancelled) return;
      if ("error" in result) {
        setError(result.error);
        setRedirecting(false);
        return;
      }
      window.location.href = result.url;
    })();
    return () => {
      cancelled = true;
    };
  }, [product, returnUrl, customerEmail]);

  if (ACTIVE_BILLING_PROVIDER === "stripe") {
    return (
      <StripeEmbeddedCheckout
        priceId={providerPriceId(product)}
        userId={userId}
        customerEmail={customerEmail}
        returnUrl={returnUrl}
      />
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-muted-foreground">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
      {redirecting ? "Taking you to secure checkout…" : "Preparing checkout…"}
    </div>
  );
}
