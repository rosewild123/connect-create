import { presenceLabel } from "@/lib/presence";

type Props = {
  lastActiveAt: string | null | undefined;
  variant?: "dot" | "badge" | "inline";
  className?: string;
};

export function PresenceIndicator({ lastActiveAt, variant = "badge", className = "" }: Props) {
  const { online, label } = presenceLabel(lastActiveAt);
  if (!label) return null;

  if (variant === "dot") {
    if (!online) return null;
    return (
      <span
        aria-label="Online now"
        title="Online now"
        className={`inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background ${className}`}
      />
    );
  }

  if (variant === "inline") {
    return (
      <span className={`inline-flex items-center gap-1 text-xs ${online ? "text-emerald-500" : "text-muted-foreground"} ${className}`}>
        {online && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
        {label}
      </span>
    );
  }

  // badge — pill style for overlaying on cards
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-400" : "bg-white/60"}`} />
      {label}
    </span>
  );
}
