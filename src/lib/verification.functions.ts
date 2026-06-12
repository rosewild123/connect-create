import { createServerFn } from "@tanstack/react-start";
import type Stripe from "stripe";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";

type StartVerificationResult = { url: string } | { error: string };

export const startIdentityVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl: string; environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<StartVerificationResult> => {
    const { userId } = context;
    try {
      const stripe = createStripeClient(data.environment);
      const session = await stripe.identity.verificationSessions.create({
        type: "document",
        metadata: { userId },
        options: {
          document: {
            require_matching_selfie: true,
            require_live_capture: true,
            require_id_number: false,
            allowed_types: ["driving_license", "passport", "id_card"],
          },
        },
        return_url: data.returnUrl,
      } as Stripe.Identity.VerificationSessionCreateParams);
      return { url: session.url ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

type RefreshResult = { verified: boolean; ageVerified?: boolean } | { error: string };

export const refreshIdentityVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<RefreshResult> => {
    const { userId } = context;
    try {
      const stripe = createStripeClient(data.environment);
      // Find most recent verification sessions and pick ones for this user
      const list = await stripe.identity.verificationSessions.list({ limit: 20 });
      const session = list.data.find(
        (s) => s.metadata?.userId === userId && s.status === "verified",
      );
      if (!session) return { verified: false };

      const dob = session.verified_outputs?.dob;
      let ageVerified = true;
      if (dob && typeof dob.year === "number" && typeof dob.month === "number" && typeof dob.day === "number") {
        const birth = new Date(dob.year, dob.month - 1, dob.day);
        const age = (Date.now() - birth.getTime()) / (365.25 * 24 * 3600 * 1000);
        ageVerified = age >= 18;
      }

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("profiles")
        .update({
          id_verified: true,
          age_verified: ageVerified,
          photo_verified: true,
          photo_verified_at: new Date().toISOString(),
        })
        .eq("id", userId);

      return { verified: true, ageVerified };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
