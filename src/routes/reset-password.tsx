import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — Senda" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated — sign in with your new password");
      navigate({ to: "/auth" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  if (!isRecovery) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <Link to="/" className="mb-10 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-display text-xl font-bold">s</div>
          <span className="font-display text-2xl font-bold">senda</span>
        </Link>
        <div className="w-full max-w-sm rounded-3xl border border-border bg-card/80 p-8 backdrop-blur text-center">
          <h1 className="font-display text-2xl font-bold">Invalid or expired link</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Request a new password reset link from the sign-in page.
          </p>
          <Button asChild className="mt-6 w-full rounded-full">
            <Link to="/auth">Back to sign in</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <Link to="/" className="mb-10 flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-display text-xl font-bold">s</div>
        <span className="font-display text-2xl font-bold">senda</span>
      </Link>

      <div className="w-full max-w-sm rounded-3xl border border-border bg-card/80 p-8 backdrop-blur">
        <h1 className="font-display text-3xl font-bold">Reset password</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose a new password for your account.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 rounded-xl" />
          </div>
          <div>
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1 rounded-xl" />
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            {loading ? "..." : "Update password"}
          </Button>
        </form>
      </div>
    </main>
  );
}
