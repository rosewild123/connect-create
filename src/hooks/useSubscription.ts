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
  const [plusUntil, setPlusUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const env = getStripeEnvironment();
    let active = true;

    const fetchAll = async () => {
      const subPromise = isPaymentsConfigured()
        ? supabase
            .from("subscriptions")
            .select("*")
            .eq("user_id", userId)
            .eq("environment", env)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null });
      const profPromise = supabase.from("profiles").select("plus_until").eq("id", userId).maybeSingle();
      const [subRes, profRes] = await Promise.all([subPromise, profPromise]);
      if (!active) return;
      setSubscription((subRes.data as SubscriptionRow | null) ?? null);
      setPlusUntil(((profRes.data as { plus_until: string | null } | null)?.plus_until) ?? null);
      setLoading(false);
    };

    fetchAll();
    const channel = supabase
      .channel(`subs:${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${userId}` }, fetchAll)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` }, fetchAll)
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, [userId]);

  const subActive = (() => {
    if (!subscription) return false;
    const end = subscription.current_period_end ? new Date(subscription.current_period_end) : null;
    const future = !end || end > new Date();
    if (["active", "trialing", "past_due"].includes(subscription.status) && future) return true;
    if (subscription.status === "canceled" && future) return true;
    return false;
  })();

  const referralActive = !!plusUntil && new Date(plusUntil) > new Date();
  const isActive = subActive || referralActive;
  const subTier: Tier = subActive ? tierFromPriceId(subscription?.price_id) : "free";
  const tier: Tier = subTier !== "free" ? subTier : (referralActive ? "plus" : "free");
  const isPlus = isActive && (tier === "plus" || tier === "premium");
  const isPremium = isActive && tier === "premium";

  return { subscription, isActive, loading, tier, isPlus, isPremium, plusUntil, referralActive };
}

export const FREE_DAILY_SWIPES = 10;
