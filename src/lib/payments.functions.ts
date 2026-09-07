import { createServerFn } from "@tanstack/react-start";
import type Stripe from "stripe";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";

/** Coupon IDs → creation params, used to lazily provision coupons in each Stripe env. */
const COUPON_PARAMS: Record<string, Pick<Stripe.CouponCreateParams, "percent_off" | "amount_off" | "currency" | "duration" | "name">> = {
  senda_launch_20pct: { percent_off: 20, duration: "once", name: "Launch offer — 20% off first month" },
  senda_trial_plus_1gbp: { amount_off: 1099, currency: "gbp", duration: "once", name: "£1 first month — Plus trial" },
  senda_trial_premium_1gbp: { amount_off: 2399, currency: "gbp", duration: "once", name: "£1 first month — Premium trial" },
};

/** Ensure a coupon exists (and is valid) in the given Stripe environment. Returns the coupon ID or null. */
async function ensureCoupon(
  stripe: ReturnType<typeof createStripeClient>,
  couponId: string,
): Promise<string | null> {
  try {
    const existing = await stripe.coupons.retrieve(couponId);
    if (existing.valid) return couponId;
    return null;
  } catch {
    // not found — create it
  }
  const params = COUPON_PARAMS[couponId];
  if (!params) return null;
  try {
    await stripe.coupons.create({ id: couponId, ...params });
    return couponId;
  } catch {
    return null;
  }
}

type CheckoutSessionResult = { clientSecret: string } | { error: string };
type PortalSessionResult = { url: string } | { error: string };
type PauseSubscriptionResult = { ok: true; paused: boolean } | { ok: true; noSubscription: true } | { error: string };

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator((data: {
    priceId: string;
    customerEmail?: string;
    userId?: string;
    returnUrl: string;
    environment: StripeEnv;
  }) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error("Invalid priceId");
    return data;
  })
  .handler(async ({ data }): Promise<CheckoutSessionResult> => {
    try {
      const stripe = createStripeClient(data.environment);
      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      if (!prices.data.length) throw new Error("Price not found");
      const stripePrice = prices.data[0];
      const isRecurring = stripePrice.type === "recurring";

      const customerId = (data.customerEmail || data.userId)
        ? await resolveOrCreateCustomer(stripe, {
            email: data.customerEmail,
            userId: data.userId,
          })
        : undefined;

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        mode: isRecurring ? "subscription" : "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        ...(customerId && { customer: customerId }),
        managed_payments: { enabled: true },
        ...(data.userId && {
          metadata: { userId: data.userId },
          ...(isRecurring && { subscription_data: { metadata: { userId: data.userId } } }),
        }),
      } as Stripe.Checkout.SessionCreateParams);

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl?: string; environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<PortalSessionResult> => {
    const { supabase, userId } = context;
    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (subError || !sub?.stripe_customer_id) {
      return { error: "No subscription found" };
    }
    try {
      const stripe = createStripeClient(data.environment);
      const portal = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id,
        ...(data.returnUrl && { return_url: data.returnUrl }),
      });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const setSubscriptionPause = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { paused: boolean; environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<PauseSubscriptionResult> => {
    const { supabase, userId } = context;
    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, status")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .in("status", ["active", "trialing", "past_due", "paused"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (subError) return { error: subError.message };
    if (!sub?.stripe_subscription_id) return { ok: true, noSubscription: true };
    try {
      const stripe = createStripeClient(data.environment);
      await stripe.subscriptions.update(sub.stripe_subscription_id, {
        pause_collection: data.paused ? { behavior: "void" } : null,
      } as unknown as Stripe.SubscriptionUpdateParams);
      return { ok: true, paused: data.paused };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
