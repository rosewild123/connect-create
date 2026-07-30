import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, Search, Handshake, AlertTriangle } from "lucide-react";

const URL = "https://sendaclub.live/blog/how-to-find-onlyfans-collaborators";
const TITLE = "How to find OnlyFans collaborators (safely) — Senda";
const DESCRIPTION =
  "A step-by-step guide to finding, vetting, and safely collaborating with other adult content creators — without cold-DMing strangers on social media.";

export const Route = createFileRoute("/blog/how-to-find-onlyfans-collaborators")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "How to find OnlyFans collaborators (safely)",
          description: DESCRIPTION,
          mainEntityOfPage: URL,
          author: { "@type": "Organization", name: "Senda" },
          publisher: { "@type": "Organization", name: "Senda" },
        }),
      },
    ],
  }),
  component: GuidePage,
});

const STEPS = [
  {
    icon: Search,
    title: "1. Decide what kind of collab you actually want",
    body: "A duo shoot, a cross-promo shoutout, a photographer for a set, or a recurring content partner are four different asks. Write yours down in one sentence before you contact anyone — it filters out mismatches instantly and makes your first message easy to say yes to.",
  },
  {
    icon: ShieldCheck,
    title: "2. Verify the person before anything else",
    body: "Age and ID verification is non-negotiable. Ask for a live video call, or work somewhere every profile is verified before it can match. On Senda, no one can swipe, match, or message until their ID and age are verified, so vetting happens before the first hello.",
  },
  {
    icon: Handshake,
    title: "3. Agree the terms in writing",
    body: "Who shoots, who edits, who posts where, revenue split, and whether either of you can resell the footage. A short written agreement before the shoot prevents almost every collab dispute. Confirm consent for every scene and keep signed 2257-style paperwork on file.",
  },
  {
    icon: AlertTriangle,
    title: "4. Shoot safely",
    body: "Meet publicly first. Tell a friend where you'll be and when you'll check in. Never send money, gift cards, or deposits to someone you haven't verified. Pressure to move off-platform fast is the most common red flag.",
  },
];

function GuidePage() {
  return (
    <main className="min-h-screen px-6 py-8 md:px-12">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Senda
        </Link>

        <h1 className="mt-8 font-display text-4xl font-bold leading-tight md:text-5xl">
          How to find OnlyFans collaborators (safely)
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Collabs are the fastest way to grow an adult content audience — a single duo scene or cross-promo puts you in
          front of someone else's whole subscriber base. The hard part isn't the content. It's finding a partner who is
          real, verified, and reliable.
        </p>

        <div className="mt-10 space-y-6">
          {STEPS.map((s) => (
            <section key={s.title} className="rounded-3xl border border-border bg-card p-6">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <h2 className="font-display text-2xl font-bold">{s.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold">Where creators look — and why most of it fails</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Twitter/X replies, Reddit threads, and Telegram groups are the default. They work occasionally, but nobody is
            verified, ghosting is normal, and you have no way to tell a working creator from a catfish or someone
            underage. Every hour spent cold-DMing is an hour not spent shooting.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Senda exists to remove that step: it's a swipe-and-match app for verified adult creators only, filtered by
            niche, platform, location, and the exact type of collab you're after — including photographers and
            videographers. You only get a conversation when you both swipe right, so there's no DM spam.
          </p>
        </section>

        <div className="mt-10 rounded-3xl border border-border bg-card p-6 text-center">
          <h2 className="font-display text-2xl font-bold">Find your next collab partner</h2>
          <p className="mt-2 text-sm text-muted-foreground">Verified creators only. 18+.</p>
          <Link
            to="/auth"
            className="mt-5 inline-block rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/30"
          >
            Create your profile
          </Link>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
        </div>
      </div>
    </main>
  );
}
