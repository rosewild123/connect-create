/**
 * Provider-agnostic billing types.
 *
 * The UI only ever speaks in these terms, so swapping the payment processor
 * (Stripe -> CCBill, etc.) is a config change plus one adapter, not a rewrite.
 */

export type BillingProviderId = "stripe" | "ccbill";

/** Stable, provider-independent identifiers for the things we sell. */
export type BillingProduct = "plus" | "premium" | "boost_single";

export type CheckoutRequest = {
  product: BillingProduct;
  userId: string;
  customerEmail?: string;
  /** Where the member should land after paying. */
  returnUrl: string;
};

/**
 * Stripe returns an embeddable client secret; CCBill (and most adult-friendly
 * processors) return a hosted payment page to redirect to.
 */
export type CheckoutSession =
  | { kind: "embedded"; provider: BillingProviderId; clientSecret: string }
  | { kind: "redirect"; provider: BillingProviderId; url: string };

export type CheckoutOutcome = CheckoutSession | { kind: "error"; error: string };

/** Capabilities differ per processor — the UI adapts instead of assuming. */
export type BillingCapabilities = {
  /** Self-serve subscription management portal inside our app. */
  customerPortal: boolean;
  /** One-off (non-recurring) purchases such as a single boost. */
  oneOffPurchases: boolean;
  /** Identity / age verification supplied by the same provider. */
  identityVerification: boolean;
};
