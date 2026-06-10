import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;

type BannerKind = "missing" | "test" | null;

function getBannerKind(): BannerKind {
  if (!clientToken) return "missing";
  if (clientToken.startsWith("pk_test_")) return "test";
  return null;
}

export function PaymentTestModeBanner() {
  const [open, setOpen] = useState(false);
  const kind = getBannerKind();
  if (!kind) return null;

  const isMissing = kind === "missing";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          "w-full px-4 py-2 text-center border-b cursor-pointer transition-colors " +
          (isMissing
            ? "bg-red-100 hover:bg-red-200 border-red-300 text-sm text-red-800"
            : "bg-orange-100 hover:bg-orange-200 border-orange-300 text-xs text-orange-800")
        }
      >
        {isMissing
          ? "Production checkout is not configured. Tap for details."
          : "Test mode — tap to view test card details."}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          {isMissing ? (
            <>
              <DialogHeader>
                <DialogTitle>Production checkout not configured</DialogTitle>
                <DialogDescription>
                  Complete payments go-live in your Lovable project to accept real payments.
                </DialogDescription>
              </DialogHeader>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  Until go-live is finished, checkout will be unavailable to your users. Once you complete the
                  go-live steps, this banner will disappear and real payments will be accepted.
                </p>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Test mode is active</DialogTitle>
                <DialogDescription>
                  Use these Stripe test cards to simulate payments. No real money will be charged.
                </DialogDescription>
              </DialogHeader>
              <div className="text-sm space-y-3">
                <div className="rounded-md border bg-muted/50 p-3 space-y-1">
                  <div className="font-medium">Successful payment</div>
                  <div className="font-mono">4242 4242 4242 4242</div>
                  <div className="text-muted-foreground text-xs">
                    Any future expiry · any 3-digit CVC · any postcode
                  </div>
                </div>
                <div className="rounded-md border bg-muted/50 p-3 space-y-1">
                  <div className="font-medium">Card declined</div>
                  <div className="font-mono">4000 0000 0000 0002</div>
                </div>
                <div className="rounded-md border bg-muted/50 p-3 space-y-1">
                  <div className="font-medium">Requires authentication (3D Secure)</div>
                  <div className="font-mono">4000 0025 0000 3155</div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Test mode disappears automatically once payments go-live is complete.
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
