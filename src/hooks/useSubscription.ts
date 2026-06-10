import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";
import { tierFromPriceId, type Tier } from "@/lib/senda";

export type SubscriptionRow = {
  id: string;
  user_id: string;
  status: string;
  price_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  environment: string;
};

export function useSubscription(userId: string | null | undefined) {
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !isPaymentsConfigured()) { setLoading(false); return; }
    const env = getStripeEnvironment();
    let active = true;

    const fetchSub = async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (active) {
        setSubscription((data as SubscriptionRow | null) ?? null);
        setLoading(false);
      }
    };

    fetchSub();
    const channel = supabase
      .channel(`subs:${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${userId}` }, fetchSub)
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, [userId]);

  const isActive = (() => {
    if (!subscription) return false;
    const end = subscription.current_period_end ? new Date(subscription.current_period_end) : null;
    const future = !end || end > new Date();
    if (["active", "trialing", "past_due"].includes(subscription.status) && future) return true;
    if (subscription.status === "canceled" && future) return true;
    return false;
  })();

  return { subscription, isActive, loading };
}

export const FREE_DAILY_SWIPES = 20;
