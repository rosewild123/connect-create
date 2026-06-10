import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const exportUserData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [profile, swipesOut, swipesIn, matches, blocks, subs, pushSubs] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("swipes").select("*").eq("swiper_id", userId),
      supabase.from("swipes").select("*").eq("swipee_id", userId),
      supabase.from("matches").select("*").or(`user_a.eq.${userId},user_b.eq.${userId}`),
      supabase.from("blocks").select("*").or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`),
      supabase.from("subscriptions").select("*").eq("user_id", userId),
      supabase.from("push_subscriptions").select("endpoint,created_at").eq("user_id", userId),
    ]);

    const matchIds = (matches.data ?? []).map((m: { id: string }) => m.id);
    const messages = matchIds.length
      ? await supabase.from("messages").select("*").in("match_id", matchIds)
      : { data: [] };

    return {
      exported_at: new Date().toISOString(),
      user_id: userId,
      profile: profile.data,
      swipes_sent: swipesOut.data ?? [],
      swipes_received: swipesIn.data ?? [],
      matches: matches.data ?? [],
      messages: messages.data ?? [],
      blocks: blocks.data ?? [],
      subscriptions: subs.data ?? [],
      push_subscriptions: pushSubs.data ?? [],
    };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Best-effort cleanup of storage objects. The auth.users delete cascades
    // profiles + most app rows via FK ON DELETE CASCADE.
    const buckets = ["profile-photos", "verifications", "chat-media"];
    for (const bucket of buckets) {
      try {
        const { data: files } = await supabaseAdmin.storage.from(bucket).list(userId, { limit: 1000 });
        if (files && files.length > 0) {
          const paths = files.map((f) => `${userId}/${f.name}`);
          await supabaseAdmin.storage.from(bucket).remove(paths);
        }
      } catch {
        // ignore — best effort
      }
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
