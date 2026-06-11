import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const searchSchema = z.object({ code: z.string().optional() });

export const Route = createFileRoute("/_authenticated/redeem")({
  head: () => ({ meta: [{ title: "Redeem code" }] }),
  validateSearch: searchSchema,
  component: RedeemPage,
});

function RedeemPage() {
  const navigate = useNavigate();
  const { code: initialCode } = useSearch({ from: "/_authenticated/redeem" });
  const [code, setCode] = useState((initialCode ?? "").toUpperCase());
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ tier: string; days: number } | null>(null);

  useEffect(() => {
    if (initialCode) setCode(initialCode.toUpperCase());
  }, [initialCode]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed || trimmed.length > 64) {
      toast.error("Enter a valid code");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.rpc("redeem_promo_code", { _code: trimmed });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const res = data as { ok: boolean; error?: string; tier?: string; days?: number };
    if (!res?.ok) {
      toast.error(res?.error ?? "Could not redeem code");
      return;
    }
    setSuccess({ tier: res.tier ?? "plus", days: res.days ?? 0 });
    toast.success(`${res.tier === "premium" ? "Premium" : "Plus"} unlocked for ${res.days} days`);
  };

  return (
    <AppShell>
      <div className="max-w-md mx-auto p-6">
        {success ? (
          <div className="text-center space-y-4 py-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold">You're in!</h1>
            <p className="text-muted-foreground">
              {success.tier === "premium" ? "Premium" : "Plus"} access unlocked for {success.days} days.
            </p>
            <Button onClick={() => navigate({ to: "/discover" })} className="w-full">
              Start exploring
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Gift className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold">Redeem your code</h1>
              <p className="text-sm text-muted-foreground">
                Enter the code you were given to unlock free access.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ALEX-PREMIUM-2026"
                maxLength={64}
                autoFocus
                className="uppercase tracking-wider"
              />
            </div>
            <Button type="submit" disabled={submitting || !code.trim()} className="w-full">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Redeem"}
            </Button>
          </form>
        )}
      </div>
    </AppShell>
  );
}
