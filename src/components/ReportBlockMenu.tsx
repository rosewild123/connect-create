import { useState } from "react";
import { MoreVertical, Flag, Ban, UserMinus } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const REASONS = [
  { id: "spam", label: "Spam or scam" },
  { id: "inappropriate_content", label: "Inappropriate content" },
  { id: "harassment", label: "Harassment or hateful" },
  { id: "fake_profile", label: "Fake profile / impersonation" },
  { id: "underage", label: "Suspected underage" },
  { id: "other", label: "Something else" },
] as const;

type Reason = typeof REASONS[number]["id"];

export function ReportBlockMenu({
  targetId, targetName, onBlocked, variant = "ghost", matchId, onUnmatched,
}: {
  targetId: string;
  targetName?: string | null;
  onBlocked?: () => void;
  variant?: "ghost" | "overlay";
  matchId?: string;
  onUnmatched?: () => void;
}) {
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [unmatchOpen, setUnmatchOpen] = useState(false);
  const [reason, setReason] = useState<Reason>("spam");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function confirmUnmatch() {
    if (!matchId) return;
    const { error } = await supabase.from("matches").delete().eq("id", matchId);
    if (error) { toast.error(error.message); return; }
    toast.success("Unmatched");
    setUnmatchOpen(false);
    onUnmatched?.();
  }

  async function submitReport() {
    setSubmitting(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSubmitting(false); return; }
    const { error } = await supabase.from("reports").insert({
      reporter_id: u.user.id,
      reported_id: targetId,
      reason,
      details: details.trim() || null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Report submitted. Our team will review it.");
    setReportOpen(false);
    setDetails("");
  }

  async function confirmBlock() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("blocks").insert({
      blocker_id: u.user.id, blocked_id: targetId,
    });
    if (error && !error.message.includes("duplicate")) { toast.error(error.message); return; }
    toast.success(`Blocked ${targetName || "user"}`);
    setBlockOpen(false);
    onBlocked?.();
  }

  const triggerClass = variant === "overlay"
    ? "grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"
    : "grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-accent";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label="More options" className={triggerClass}>
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => setReportOpen(true)}>
            <Flag className="mr-2 h-4 w-4" /> Report
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setBlockOpen(true)} className="text-destructive focus:text-destructive">
            <Ban className="mr-2 h-4 w-4" /> Block
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Report {targetName || "this profile"}</DialogTitle>
            <DialogDescription>Reports are anonymous. Our team reviews every report.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Reason</Label>
              <div className="flex flex-wrap gap-1.5">
                {REASONS.map((r) => (
                  <button key={r.id} type="button" onClick={() => setReason(r.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${reason === r.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="details" className="text-xs uppercase tracking-widest text-muted-foreground">Details (optional)</Label>
              <Textarea id="details" value={details} maxLength={1000}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Anything else we should know?" rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button onClick={submitReport} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={blockOpen} onOpenChange={setBlockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block {targetName || "this user"}?</AlertDialogTitle>
            <AlertDialogDescription>
              You won't see each other in Discover, Likes, or Matches. You can unblock later from Profile → Blocked users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBlock} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
