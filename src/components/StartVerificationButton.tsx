import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { startIdentityVerification } from "@/lib/verification.functions";
import { startYotiVerification } from "@/lib/verification/yoti.functions";
import { ACTIVE_VERIFICATION_PROVIDER } from "@/lib/verification/config";
import { getStripeEnvironment } from "@/lib/stripe";

/**
 * Kicks off identity verification with whichever provider is active and
 * redirects to its hosted flow. `beforeStart` lets the caller persist state
 * (e.g. finish onboarding) before the user leaves the app.
 */
export function StartVerificationButton({
  returnUrl,
  label = "Verify my ID",
  beforeStart,
  className,
}: {
  returnUrl: string;
  label?: string;
  beforeStart?: () => Promise<void> | void;
  className?: string;
}) {
  const startVerify = useServerFn(startIdentityVerification);
  const startYoti = useServerFn(startYotiVerification);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await beforeStart?.();

      if (ACTIVE_VERIFICATION_PROVIDER === "yoti") {
        const outcome = await startYoti({ data: { returnUrl } });
        if (outcome.kind === "error") {
          toast.error(outcome.error);
          setLoading(false);
          return;
        }
        if (outcome.kind === "already_verified") {
          window.location.href = returnUrl;
          return;
        }
        window.location.href = outcome.url;
        return;
      }

      const result = await startVerify({
        data: { returnUrl, environment: getStripeEnvironment() },
      });
      if ("error" in result) {
        const friendly =
          /identity/i.test(result.error) && /not set up|invalid_application|identity_api/i.test(result.error)
            ? "Verification isn't available yet — we're finishing setup. Please check back soon."
            : result.error;
        toast.error(friendly);
        setLoading(false);
        return;
      }
      if ("alreadyVerified" in result) {
        window.location.href = returnUrl;
        return;
      }
      window.location.href = result.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start verification");
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading} className={className}>
      {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-1 h-4 w-4" />}
      {loading ? "Opening…" : label}
    </Button>
  );
}
