import { createFileRoute } from "@tanstack/react-router";
import type Stripe from "stripe";

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const envParam = url.searchParams.get("env");
        const env: "sandbox" | "live" = envParam === "live" ? "live" : "sandbox";

        const signature = request.headers.get("stripe-signature");
        if (!signature) return new Response("Missing signature", { status: 400 });
        const body = await request.text();

        const { createStripeClient, getWebhookSecret } = await import("@/lib/stripe.server");
        const stripe = createStripeClient(env);
        const webhookSecret = getWebhookSecret(env);

        let event: Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
        } catch (err) {
          console.error("Webhook signature verification failed:", err);
          return new Response("Invalid signature", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        try {
          switch (event.type) {
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
              const sub = event.data.object as Stripe.Subscription;
              await upsertSubscription(stripe, supabaseAdmin, sub, env);
              break;
            }
            case "checkout.session.completed": {
              const session = event.data.object as Stripe.Checkout.Session;
              if (session.mode === "subscription" && session.subscription) {
                const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
                const sub = await stripe.subscriptions.retrieve(subId);
                await upsertSubscription(stripe, supabaseAdmin, sub, env);
              } else if (session.mode === "payment") {
                await handleOneOffPayment(stripe, supabaseAdmin, session);
              }
              break;
            }
            case "identity.verification_session.verified": {
              const vs = event.data.object as Stripe.Identity.VerificationSession;
              const userId = vs.metadata?.userId;
              if (!userId) {
                console.warn("Identity session has no userId metadata", vs.id);
                break;
              }
              const dob = vs.verified_outputs?.dob;
              let ageVerified = true;
              if (dob && typeof dob.year === "number" && typeof dob.month === "number" && typeof dob.day === "number") {
                const birth = new Date(dob.year, dob.month - 1, dob.day);
                const age = (Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000);
                ageVerified = age >= 18;
              }
              const { error } = await supabaseAdmin
                .from("profiles")
                .update({
                  id_verified: true,
                  age_verified: ageVerified,
                  photo_verified: true,
                  photo_verified_at: new Date().toISOString(),
                })
                .eq("id", userId);
              if (error) console.error("Failed to mark profile verified", error);

              break;
            }
            default:
              break;
          }
        } catch (err) {
          console.error("Webhook handler error:", err);
          return new Response("Handler error", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});

async function upsertSubscription(
  stripe: Stripe,
  supabaseAdmin: import("@supabase/supabase-js").SupabaseClient,
  sub: Stripe.Subscription,
  env: "sandbox" | "live",
) {
  // Resolve userId — prefer subscription metadata, fall back to customer metadata
  let userId = sub.metadata?.userId as string | undefined;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  if (!userId) {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer && !("deleted" in customer && customer.deleted)) {
      userId = (customer as Stripe.Customer).metadata?.userId;
    }
  }
  if (!userId) {
    console.warn("Subscription has no userId metadata", sub.id);
    return;
  }

  const item = sub.items.data[0];
  const price = item?.price;
  // Use lookup_key for stable cross-env price id; fall back to Stripe price id
  const priceLookup = (price?.lookup_key as string | undefined) ?? price?.id ?? null;
  const productId = typeof price?.product === "string" ? price.product : price?.product?.id ?? null;

  // current_period_end lives on the subscription item in newer API versions
  const periodEndUnix = (item as { current_period_end?: number } | undefined)?.current_period_end
    ?? (sub as unknown as { current_period_end?: number }).current_period_end;
  const currentPeriodEnd = periodEndUnix ? new Date(periodEndUnix * 1000).toISOString() : null;

  const row = {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    status: sub.status,
    price_id: priceLookup,
    product_id: productId,
    current_period_end: currentPeriodEnd,
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
    environment: env,
  };

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .upsert(row, { onConflict: "stripe_subscription_id" });
  if (error) {
    console.error("Failed to upsert subscription", error);
    throw error;
  }
}

async function handleOneOffPayment(
  stripe: Stripe,
  supabaseAdmin: import("@supabase/supabase-js").SupabaseClient,
  session: Stripe.Checkout.Session,
) {
  const userId = session.metadata?.userId as string | undefined;
  if (!userId) {
    console.warn("One-off checkout session has no userId metadata", session.id);
    return;
  }
  const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10, expand: ["data.price"] });
  for (const item of items.data) {
    const price = item.price;
    const lookup = (price?.lookup_key as string | undefined) ?? price?.id;
    if (lookup === "senda_boost_single_gbp") {
      const durationMin = 30;
      const endsAt = new Date(Date.now() + durationMin * 60_000).toISOString();
      const { error } = await supabaseAdmin
        .from("boosts")
        .insert({ user_id: userId, ends_at: endsAt, source: "one_off_purchase" });
      if (error) {
        console.error("Failed to insert one-off boost", error);
        throw error;
      }
    }
  }
}
