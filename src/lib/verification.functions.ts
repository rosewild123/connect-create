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
