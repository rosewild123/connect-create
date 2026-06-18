import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Senda" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/discover" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/discover" },
        });
        if (error) throw error;
        toast.success("Account created — check your email if confirmation is required.");
        navigate({ to: "/onboarding" });
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        toast.success("Check your email for a reset link.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/discover" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/discover" });
    if (result.error) {
      toast.error("Google sign-in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/discover" });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <Link to="/" className="mb-10 flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-display text-xl font-bold">s</div>
        <span className="font-display text-2xl font-bold">senda</span>
      </Link>

      <div className="w-full max-w-sm rounded-3xl border border-border bg-card/80 p-8 backdrop-blur">
        <h1 className="font-display text-3xl font-bold">
          {mode === "signin" ? "Welcome back" : mode === "forgot" ? "Reset password" : "Join Senda"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin" ? "Sign in to keep swiping." : mode === "forgot" ? "We'll send you a reset link." : "Creators only. 18+."}
        </p>

        {mode !== "forgot" && (
          <Button onClick={handleGoogle} disabled={loading} variant="outline" className="mt-6 w-full rounded-full">
            Continue with Google
          </Button>
        )}

        {mode !== "forgot" && (
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 rounded-xl" />
          </div>
          {mode !== "forgot" && (
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 rounded-xl" />
            </div>
          )}
          {mode === "signin" && (
            <button
              type="button"
              onClick={() => setMode("forgot")}
              className="block text-xs text-muted-foreground hover:text-foreground"
            >
              Forgot password?
            </button>
          )}
          <Button type="submit" disabled={loading} className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            {loading ? "..." : mode === "signin" ? "Sign in" : mode === "forgot" ? "Send reset link" : "Create account"}
          </Button>
        </form>

        {mode === "signup" && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            By creating an account, you agree to our{" "}
            <Link to="/terms" className="text-primary underline">Terms of Service</Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.
          </p>
        )}
        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-5 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "New here? Create an account" : mode === "forgot" ? "Back to sign in" : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
