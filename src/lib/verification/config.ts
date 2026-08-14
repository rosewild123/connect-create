import type { VerificationCapabilities, VerificationProviderId } from "./types";

/**
 * Which verification provider is live. Set VITE_VERIFICATION_PROVIDER="yoti"
 * once the Yoti SDK credentials are configured; until then this stays on
 * Stripe Identity so verification keeps working.
 */
export const ACTIVE_VERIFICATION_PROVIDER: VerificationProviderId =
  (import.meta.env.VITE_VERIFICATION_PROVIDER as VerificationProviderId | undefined) ?? "stripe";

export const VERIFICATION_CAPABILITIES: Record<VerificationProviderId, VerificationCapabilities> = {
  stripe: { documentAndSelfie: true, ageEstimation: true, billedPerCompletion: false },
  yoti: { documentAndSelfie: true, ageEstimation: true, billedPerCompletion: true },
};

export function verificationCapabilities(): VerificationCapabilities {
  return VERIFICATION_CAPABILITIES[ACTIVE_VERIFICATION_PROVIDER];
}
