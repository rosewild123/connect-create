import { Link } from "@tanstack/react-router";
import { ShieldCheck, ChevronRight } from "lucide-react";

/**
 * Slim banner reminding unverified members that verification unlocks
 * swiping, likes and messaging.
 */
export function VerifyNudge() {
  return (
    <Link
      to="/profile"
      className="flex items-center gap-3 border-b border-primary/25 bg-primary/10 px-4 py-2.5 text-left"
    >
      <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
      <span className="flex-1 text-xs leading-snug">
        <span className="font-semibold">Verify your ID to go live.</span>{" "}
        <span className="text-muted-foreground">
          Until you do, you can&apos;t swipe, like or message.
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
