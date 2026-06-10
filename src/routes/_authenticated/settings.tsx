import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Download, LogOut, Trash2, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { deleteAccount, exportUserData } from "@/lib/account.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Senda" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const doExport = useServerFn(exportUserData);
  const doDelete = useServerFn(deleteAccount);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

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
      </div>
    </AppShell>
  );
}
