import { createFileRoute } from "@tanstack/react-router";

/**
 * Yoti IDV notification receiver.
 *
 * Yoti posts session/check completion events to the notification endpoint we
 * registered when creating the session. The endpoint is protected by a shared
 * secret embedded in that URL, and the result is always re-fetched from Yoti's
 * API rather than trusted from the payload.
 */
export const Route = createFileRoute("/api/public/verification/yoti-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["YOTI_WEBHOOK_SECRET"];
        if (!expected) return new Response("Not configured", { status: 503 });

        const provided = new URL(request.url).searchParams.get("secret") ?? "";
        if (provided.length !== expected.length || provided !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        let payload: { session_id?: string; topic?: string };
        try {
          payload = (await request.json()) as { session_id?: string; topic?: string };
        } catch {
          return new Response("Bad request", { status: 400 });
        }

        const sessionId = payload.session_id;
        if (!sessionId) return new Response("ok");

        try {
          const { fetchYotiSession } = await import("@/lib/verification/yoti.server");
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const result = await fetchYotiSession(sessionId);

          const { data: row } = await supabaseAdmin
            .from("verification_sessions")
            .select("user_id")
            .eq("provider", "yoti")
            .eq("session_id", sessionId)
            .maybeSingle();

          const userId = (row?.user_id as string | undefined) ?? result.userTrackingId;
          if (!userId) {
            console.warn("Yoti event for unknown session", sessionId);
            return new Response("ok");
          }

          const status = result.approved
            ? "approved"
            : result.state === "COMPLETED"
              ? "rejected"
              : "processing";

          await supabaseAdmin
            .from("verification_sessions")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("provider", "yoti")
            .eq("session_id", sessionId);

          if (result.approved) {
            let ageVerified = true;
            if (result.dateOfBirth) {
              const birth = new Date(result.dateOfBirth);
              const age = (Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000);
              ageVerified = age >= 18;
            }
            await supabaseAdmin
              .from("profiles")
              .update({
                id_verified: true,
                age_verified: ageVerified,
                photo_verified: true,
                photo_verified_at: new Date().toISOString(),
              })
              .eq("id", userId);
          }

          return new Response("ok");
        } catch (error) {
          console.error("Yoti webhook error", error);
          return new Response("Webhook error", { status: 500 });
        }
      },
    },
  },
});
