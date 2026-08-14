import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { StartVerificationOutcome } from "@/lib/verification/types";

/**
 * Starts (or reuses) a Yoti IDV session for the signed-in member. Yoti bills
 * per completed session, so an in-flight session is reused rather than
 * creating a new one on every attempt.
 */
export const startYotiVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl: string }) => data)
  .handler(async ({ data, context }): Promise<StartVerificationOutcome> => {
    const { supabase, userId } = context;
    try {
      const { data: profile } = await supabase.rpc("get_my_profile").maybeSingle();
      const row = profile as { id_verified?: boolean | null } | null;
      if (row?.id_verified) return { kind: "already_verified" };

      const { data: existing } = await supabase
        .from("verification_sessions")
        .select("session_url, status")
        .eq("user_id", userId)
        .eq("provider", "yoti")
        .in("status", ["created", "processing"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing?.session_url) {
        return { kind: "redirect", url: existing.session_url, reused: true };
      }

      const { createYotiSession } = await import("@/lib/verification/yoti.server");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const origin = new URL(data.returnUrl).origin;
      const session = await createYotiSession({
        userId,
        returnUrl: data.returnUrl,
        notificationUrl: `${origin}/api/public/verification/yoti-webhook?secret=${encodeURIComponent(
          process.env["YOTI_WEBHOOK_SECRET"] ?? "",
        )}`,
      });

      await supabaseAdmin.from("verification_sessions").insert({
        user_id: userId,
        provider: "yoti",
        session_id: session.sessionId,
        session_url: session.url,
        status: "created",
      });

      return { kind: "redirect", url: session.url };
    } catch (error) {
      return {
        kind: "error",
        error: error instanceof Error ? error.message : "Could not start verification",
      };
    }
  });
