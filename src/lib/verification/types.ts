/**
 * Provider-agnostic identity / age verification types.
 *
 * The UI only ever speaks in these terms, so swapping the verification
 * provider (Stripe Identity -> Yoti, etc.) is a config change plus one
 * adapter, not a rewrite.
 */

export type VerificationProviderId = "stripe" | "yoti";

export type StartVerificationOutcome =
  | { kind: "redirect"; url: string; reused?: boolean }
  | { kind: "already_verified" }
  | { kind: "error"; error: string };

export type VerificationCapabilities = {
  /** Provider returns a document + selfie (biometric) match. */
  documentAndSelfie: boolean;
  /** Provider returns a date of birth we can use for an 18+ check. */
  ageEstimation: boolean;
  /** Provider charges per completed session rather than per attempt. */
  billedPerCompletion: boolean;
};
