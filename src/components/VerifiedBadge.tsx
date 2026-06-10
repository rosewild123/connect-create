import { BadgeCheck } from "lucide-react";

export function VerifiedBadge({ className = "" }: { className?: string }) {
  return (
    <BadgeCheck
      className={`inline-block shrink-0 fill-sky-500 text-white ${className}`}
      aria-label="Verified"
    />
  );
}
