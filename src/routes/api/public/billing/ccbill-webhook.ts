import { createFileRoute } from "@tanstack/react-router";

/**
 * CCBill background post (webhook) receiver.
 *
 * CCBill posts form-encoded events and does not sign them, so the endpoint is
 * protected by a shared secret configured in the CCBill background-post URL
 * (?secret=...) and compared here.
 */
export const Route = createFileRoute("/api/public/billing/ccbill-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["CCBILL_WEBHOOK_SECRET"];
        if (!expected) return new Response("Not configured", { status: 503 });

        const url = new URL(request.url);
        const provided = url.searchParams.get("secret") ?? "";
        if (provided.length !== expected.length || provided !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const form = await request.formData();
        const get = (key: string) => {
          const value = form.get(key);
          return typeof value === "string" ? value : undefined;
        };

        const eventType = get("eventType") ?? get("eventGroupType") ?? "";
        const userId = get("X-userId");
        const product = get("X-product");
        const subscriptionId = get("subscriptionId");

        if (!userId) {
          console.warn("CCBill event without userId passthrough", eventType);
          return new Response("ok");
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const priceId =
          product === "premium"
            ? "senda_premium_monthly_gbp"
            : product === "plus"
              ? "senda_plus_monthly_gbp"
              : product === "boost_single"
                ? "senda_boost_single_gbp"
                : null;

        try {
          if (product === "boost_single" && eventType === "NewSaleSuccess") {
            const endsAt = new Date(Date.now() + 30 * 60_000).toISOString();
            const { error } = await supabaseAdmin
              .from("boosts")
              .insert({ user_id: userId, ends_at: endsAt, source: "one_off_purchase" });
            if (error) console.error("CCBill boost grant failed", error);
            return new Response("ok");
          }


          if (!subscriptionId || !priceId) return new Response("ok");

          const status =
            eventType === "NewSaleSuccess" || eventType === "RenewalSuccess"
              ? "active"
              : eventType === "Cancellation"
                ? "canceled"
                : eventType === "Expiration" || eventType === "Chargeback" || eventType === "Refund"
                  ? "canceled"
                  : eventType === "RenewalFailure"
                    ? "past_due"
                    : null;
          if (!status) return new Response("ok");

          const nextRenewal = get("nextRenewalDate");
          const { error } = await supabaseAdmin.from("subscriptions").upsert(
            {
              user_id: userId,
              stripe_customer_id: `ccbill:${subscriptionId}`,
              stripe_subscription_id: `ccbill:${subscriptionId}`,
              status,
              price_id: priceId,
              product_id: product ?? null,
              current_period_end: nextRenewal ? new Date(nextRenewal).toISOString() : null,
              cancel_at_period_end: eventType === "Cancellation",
              environment: "live",
            },
            { onConflict: "stripe_subscription_id" },
          );
          if (error) {
            console.error("CCBill subscription upsert failed", error);
            return new Response("Handler error", { status: 500 });
          }
        } catch (err) {
          console.error("CCBill webhook handler error", err);
          return new Response("Handler error", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});
