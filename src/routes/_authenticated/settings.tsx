import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Download, LogOut, Trash2, Loader2, ShieldAlert, ShieldCheck, Ban, ChevronRight, Gavel, Pause, Tag } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { deleteAccount, exportUserData } from "@/lib/account.functions";
import { setSubscriptionPause } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Senda" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const doExport = useServerFn(exportUserData);
  const doDelete = useServerFn(deleteAccount);
  const doPauseSub = useServerFn(setSubscriptionPause);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [me, setMe] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [pausing, setPausing] = useState(false);
  useEffect(() => { (async () => {
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id ?? null;
    setMe(uid);
    if (uid) {
      const { data: p } = await supabase.from("profiles").select("is_paused").eq("id", uid).maybeSingle();
      setPaused(!!p?.is_paused);
    }
  })(); }, []);
  const { isAdmin } = useIsAdmin(me);

  async function togglePause(next: boolean) {
    if (!me) return;
    setPausing(true);
    const prev = paused;
    setPaused(next);
    const { error } = await supabase.from("profiles").update({ is_paused: next }).eq("id", me);
    if (error) {
      setPaused(prev);
      setPausing(false);
      toast.error(error.message);
      return;
    }
    let subNote = "";
    try {
      const res = await doPauseSub({ data: { paused: next, environment: getStripeEnvironment() } });
      if ("error" in res) {
        subNote = next
          ? " (couldn't pause your subscription — manage it from billing)"
          : " (couldn't resume your subscription — manage it from billing)";
      } else if (!("noSubscription" in res)) {
        subNote = next
          ? " — billing paused too"
          : " — billing resumed";
      }
    } catch {
      subNote = "";
    }
    setPausing(false);
    toast.success((next ? "Account paused — you're hidden from Discover" : "Welcome back — you're visible again") + subNote);
  }


  async function handleExport() {
    setExporting(true);
    try {
      const data = await doExport();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `senda-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Export ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
    toast.success("Signed out");
  }

  async function handleDelete() {
    if (confirmText.trim().toUpperCase() !== "DELETE") {
      toast.error('Type DELETE to confirm');
      return;
    }
    setDeleting(true);
    try {
      await doDelete();
      await supabase.auth.signOut();
      toast.success("Account deleted");
      navigate({ to: "/", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete account");
      setDeleting(false);
    }
  }

  return (
    <AppShell>
      <header className="flex items-center gap-3 px-5 py-4">
        <Link to="/profile" aria-label="Back"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
      </header>

      <div className="space-y-3 px-5 pb-8">
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <Link to="/safety" className="flex items-center gap-3 p-4 transition hover:bg-muted/40">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">Safety center</div>
              <p className="text-xs text-muted-foreground">Tips, tools, and what to do in an emergency.</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <div className="h-px bg-border" />
          <Link to="/blocked" className="flex items-center gap-3 p-4 transition hover:bg-muted/40">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
              <Ban className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">Blocked users</div>
              <p className="text-xs text-muted-foreground">Review and manage people you've blocked.</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </section>

        {isAdmin && (
          <section className="overflow-hidden rounded-2xl border border-primary/40 bg-primary/5">
            <Link to="/admin/reports" className="flex items-center gap-3 p-4 transition hover:bg-primary/10">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                <Gavel className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Reports queue</div>
                <p className="text-xs text-muted-foreground">Triage flagged users and chat reports.</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <div className="h-px bg-primary/20" />
            <Link to="/admin/promo-codes" className="flex items-center gap-3 p-4 transition hover:bg-primary/10">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                <Tag className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Promo codes</div>
                <p className="text-xs text-muted-foreground">Create and manage influencer invite codes.</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </section>
        )}

        <section className="rounded-2xl border-2 border-primary/50 bg-primary/5 p-4">
          <p className="font-semibold text-foreground">Your user ID</p>
          <p className="mt-1 text-xs text-muted-foreground">Tap to copy and send to support.</p>
          <button
            type="button"
            onClick={() => {
              if (!me) return;
              navigator.clipboard.writeText(me);
              toast.success("User ID copied");
            }}
            className="mt-2 block w-full break-all rounded bg-muted px-3 py-2 text-left text-xs font-mono text-foreground hover:bg-muted/70"
          >
            {me ?? "Loading…"}
          </button>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
              <Download className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">Export your data</div>
              <p className="text-xs text-muted-foreground">
                Download a JSON copy of your profile, matches, messages, swipes, and subscriptions.
              </p>
              <Button
                onClick={handleExport}
                disabled={exporting}
                variant="outline"
                size="sm"
                className="mt-3 rounded-full"
              >
                {exporting ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Preparing…</> : "Download export"}
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${paused ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
              <Pause className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold">Pause account</div>
                <Switch checked={paused} onCheckedChange={togglePause} disabled={pausing || !me} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Take a break. You won't appear in Discover, won't get new likes, and any monthly subscription pauses billing until you're back. Matches and messages stay safe — turn it back on anytime.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
              <LogOut className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">Log out</div>
              <p className="text-xs text-muted-foreground">Sign out of Senda on this device.</p>
              <Button onClick={handleSignOut} variant="outline" size="sm" className="mt-3 rounded-full">
                Log out
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-destructive/15 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-destructive">Delete account</div>
              <p className="text-xs text-muted-foreground">
                Permanently remove your profile, photos, matches, and messages. This cannot be undone.
              </p>
              {!confirmOpen ? (
                <Button
                  onClick={() => setConfirmOpen(true)}
                  variant="destructive"
                  size="sm"
                  className="mt-3 rounded-full"
                >
                  Delete account
                </Button>
              ) : (
                <div className="mt-3 space-y-2 rounded-xl border border-destructive/30 bg-background/40 p-3">
                  <div className="flex items-start gap-2 text-xs text-destructive">
                    <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      Tip: download your export first. Type <span className="font-bold">DELETE</span> to confirm.
                    </span>
                  </div>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-full"
                      onClick={() => { setConfirmOpen(false); setConfirmText(""); }}
                      disabled={deleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1 rounded-full"
                      onClick={handleDelete}
                      disabled={deleting || confirmText.trim().toUpperCase() !== "DELETE"}
                    >
                      {deleting ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Deleting…</> : "Delete forever"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">
            <p>Read our legal documents:</p>
            <div className="mt-2 flex items-center gap-4">
              <Link to="/terms" className="text-primary underline">Terms of Service</Link>
              <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
