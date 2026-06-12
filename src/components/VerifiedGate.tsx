import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VerifiedGate({
  title = "Verify to continue",
  subtitle = "For everyone's safety, you need to verify your identity before you can swipe, like, or message other creators.",
}: { title?: string; subtitle?: string }) {
  return (
    <div className="mt-12 px-2 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-primary">
        <ShieldCheck className="h-7 w-7" />
      </div>
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{subtitle}</p>
      <Button asChild className="mt-5 rounded-full px-6">
        <Link to="/profile">Verify now</Link>
      </Button>
    </div>
  );
}
