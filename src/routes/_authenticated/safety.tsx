import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { ArrowLeft, Shield, Flag, Ban, UserMinus, Lock, AlertTriangle, Eye, MessageCircleWarning } from "lucide-react";

export const Route = createFileRoute("/_authenticated/safety")({
  head: () => ({ meta: [{ title: "Safety center — Senda" }] }),
  component: SafetyPage,
});

const TIPS = [
  { icon: Eye, title: "Verify before you trust", body: "Look for the verification badge. Ask for a quick selfie or live video before sharing anything personal." },
  { icon: Lock, title: "Keep personal info off-app", body: "Don't share your legal name, home address, banking details, or government IDs in chat." },
  { icon: MessageCircleWarning, title: "Watch for red flags", body: "Pressure to move off-platform fast, asks for money or gift cards, sob stories, or 'too good to be true' offers." },
  { icon: AlertTriangle, title: "Meeting in person", body: "Meet in public the first time. Tell a friend where you're going. Trust your gut — leave if anything feels off." },
];

const ACTIONS = [
  { icon: Flag, title: "Report", body: "Tap the menu on any profile or chat to report. Reports are anonymous and reviewed by our team." },
  { icon: UserMinus, title: "Unmatch", body: "Remove a match and its chat from both sides at any time from the chat menu." },
  { icon: Ban, title: "Block", body: "Blocking hides you from each other across Discover, Likes, and Matches. Manage blocks from your Profile." },
];

function SafetyPage() {
  return (
    <AppShell>
      <header className="flex items-center gap-3 px-5 py-4">
        <Link to="/profile" className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="font-display text-2xl font-bold">Safety center</h1>
      </header>

      <div className="space-y-6 px-5 pb-10">
        <section className="rounded-3xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <h2 className="font-display text-lg font-semibold">Stay safe on Senda</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Senda is built for creators in adult industries — that comes with extra risks. These habits help you stay in control.
          </p>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Safety tips</h3>
          <ul className="space-y-2">
            {TIPS.map((t) => (
              <li key={t.title} className="flex gap-3 rounded-2xl border border-border bg-card p-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-foreground">
                  <t.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold">{t.title}</div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{t.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tools you have</h3>
          <ul className="space-y-2">
            {ACTIONS.map((a) => (
              <li key={a.title} className="flex gap-3 rounded-2xl border border-border bg-card p-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-foreground">
                  <a.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold">{a.title}</div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{a.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-destructive/40 bg-destructive/5 p-5">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="font-semibold text-destructive">In an emergency</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            If you're in danger or being threatened, contact local emergency services first. Then report the user here so we can take action on the account.
          </p>
        </section>

        <div className="flex gap-2">
          <Link to="/blocked" className="flex-1 rounded-full border border-border bg-card px-4 py-3 text-center text-sm font-medium">
            Blocked users
          </Link>
          <Link to="/matches" className="flex-1 rounded-full border border-border bg-card px-4 py-3 text-center text-sm font-medium">
            Back to matches
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
