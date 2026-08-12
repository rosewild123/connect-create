import type { BillingCapabilities, BillingProduct, BillingProviderId } from "./types";
import { PRICE_BOOST_SINGLE, PRICE_PLUS, PRICE_PREMIUM } from "@/lib/senda";

/**
 * Which processor is live. Set VITE_BILLING_PROVIDER="ccbill" once the CCBill
 * merchant account is approved and its credentials are configured; until then
 * this stays on Stripe.
 */
export const ACTIVE_BILLING_PROVIDER: BillingProviderId =
  (import.meta.env.VITE_BILLING_PROVIDER as BillingProviderId | undefined) ?? "stripe";

export const CAPABILITIES: Record<BillingProviderId, BillingCapabilities> = {
  stripe: { customerPortal: true, oneOffPurchases: true, identityVerification: true },
  // CCBill members manage/cancel subscriptions through CCBill consumer support
  // or our own cancel request, not an embedded portal.
  ccbill: { customerPortal: false, oneOffPurchases: true, identityVerification: false },
};

export function capabilities(): BillingCapabilities {
  return CAPABILITIES[ACTIVE_BILLING_PROVIDER];
}

/** Human-readable catalog, shared by the upgrade page and the billing policy. */
export const CATALOG: Record<
  BillingProduct,
  { name: string; priceLabel: string; recurring: boolean; stripePriceId: string }
> = {
  plus: { name: "Senda Plus", priceLabel: "£11.99", recurring: true, stripePriceId: PRICE_PLUS },
  premium: { name: "Senda Premium", priceLabel: "£24.99", recurring: true, stripePriceId: PRICE_PREMIUM },
  boost_single: { name: "Single boost", priceLabel: "£2.99", recurring: false, stripePriceId: PRICE_BOOST_SINGLE },
};

/** Maps our stable product ids to the current provider's price identifier. */
export function providerPriceId(product: BillingProduct): string {
  return CATALOG[product].stripePriceId;
}
