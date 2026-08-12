import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/compliance")({
  head: () => ({
    meta: [
      { title: "18+ Age & Content Compliance — Senda" },
      {
        name: "description",
        content:
          "Senda's 18+ policy: mandatory government ID and age verification, consent requirements, prohibited content, and how to report illegal material.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "18+ Age & Content Compliance — Senda" },
      {
        property: "og:description",
        content: "Mandatory ID and age verification, consent rules, prohibited content, and reporting channels.",
      },
      { property: "og:url", content: "https://sendaclub.live/compliance" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "18+ Age & Content Compliance — Senda" },
      {
        name: "twitter:description",
        content: "Mandatory ID and age verification, consent rules, prohibited content, and reporting channels.",
      },
    ],
    links: [{ rel: "canonical", href: "https://sendaclub.live/compliance" }],
  }),
  component: CompliancePage,
});

function CompliancePage() {
  return (
    <main className="min-h-screen px-6 py-8 md:px-12">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Senda
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <h1 className="font-display text-3xl font-bold">Age &amp; Content Compliance</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: August 2026</p>

        <div className="mt-6 rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm">
          <p className="font-semibold text-foreground">Senda is an 18+ only platform.</p>
          <p className="mt-1 text-muted-foreground">
            Every member must pass government-issued photo ID and age verification with a matching live selfie before
            they can swipe, match, or message. Unverified accounts cannot be seen by other members and cannot
            communicate.
          </p>
        </div>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <Section title="1. What Senda is">
            <p>
              Senda is a members-only professional networking and collaboration platform for adult content creators and
              the people who work with them, such as photographers and videographers. Members use Senda to find
              collaborators, arrange shoots, and cross-promote their own independent channels.
            </p>
            <p className="mt-2">
              Senda does <span className="text-foreground">not</span> host, sell, stream, resell, or monetise explicit
              media. There is no pay-per-view, no tipping, no paid content unlocks, and no adult media library. Paid
              plans affect discovery and messaging features only.
            </p>
          </Section>

          <Section title="2. Age verification">
            <p>
              Age assurance is mandatory and applied to every account, not just paying members. Verification is
              performed by a specialist identity provider and requires:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>A valid government-issued photo ID (passport, driving licence, or national ID card).</li>
              <li>A live selfie captured at the time of the check, matched against the document photo.</li>
              <li>A date of birth on the document confirming the member is 18 or older.</li>
            </ul>
            <p className="mt-2">
              We store only the verification outcome and the verified age flag. We do not retain copies of ID documents
              on our own systems. Any account found to belong to a minor, or to have used another person's documents,
              is terminated immediately and permanently.
            </p>
          </Section>

          <Section title="3. Consent and identity of people depicted">
            <p>
              Members may only upload photographs of themselves, taken with their own knowledge and consent, in which
              they are the only identifiable person. Uploading images of any other person — including a partner,
              colleague, or client — without that person's documented consent is prohibited and is grounds for removal.
            </p>
            <p className="mt-2">
              Profile photos are reviewed and must be non-explicit: no exposed genitals, no depicted sexual acts, and no
              sexualised depiction of anyone who appears to be a minor.
            </p>
          </Section>

          <Section title="4. Prohibited content and conduct">
            <p>The following result in immediate, permanent removal and, where applicable, a report to law enforcement:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Any content involving, or appearing to involve, a person under 18.</li>
              <li>Non-consensual, coerced, or covertly recorded content, including revenge imagery.</li>
              <li>Human trafficking, sexual exploitation, or the arrangement of commercial sexual services.</li>
              <li>Escort, prostitution, or in-person paid sexual services offered or solicited through Senda.</li>
              <li>Bestiality, incest, and depictions of non-consensual violence.</li>
              <li>Impersonation, stolen photographs, or misrepresented identity.</li>
              <li>Harassment, threats, stalking, doxxing, or the sharing of another member's private information.</li>
              <li>Off-platform payment solicitation, scams, and financial exploitation of other members.</li>
            </ul>
          </Section>

          <Section title="5. Moderation and enforcement">
            <p>
              Every profile, photo, and prompt is subject to review. Members can report or block any other member from
              the profile and chat screens, and reports are triaged by our team. We may suspend an account while a
              report is investigated. Enforcement outcomes range from content removal and feature restriction to
              permanent termination.
            </p>
            <p className="mt-2">
              Content that appears to involve a minor is removed on sight, preserved for the authorities, and reported
              to the relevant national body.
            </p>
          </Section>

          <Section title="6. Reporting illegal or non-consensual content">
            <p>
              Anyone — member or not — can report content. Email{" "}
              <a href="mailto:report@sendaclub.live" className="text-primary underline">report@sendaclub.live</a> with
              the profile name or link and a description of the issue. Reports concerning a minor or non-consensual
              imagery are prioritised and actioned within 24 hours.
            </p>
            <p className="mt-2">
              If you appear in an image on Senda that was posted without your consent, email the same address and we
              will remove it on receipt, before any investigation, and confirm removal to you.
            </p>
          </Section>

          <Section title="7. Records and cooperation">
            <p>
              We retain verification outcomes, moderation decisions, report histories, and account access logs for the
              period required to meet our legal obligations and to assist lawful investigations. We cooperate fully with
              valid requests from law enforcement and from our payment and identity partners.
            </p>
          </Section>

          <Section title="8. Contact">
            <p>
              Compliance enquiries:{" "}
              <a href="mailto:compliance@sendaclub.live" className="text-primary underline">compliance@sendaclub.live</a>
              . Reports: <a href="mailto:report@sendaclub.live" className="text-primary underline">report@sendaclub.live</a>
              . Billing: <a href="mailto:support@sendaclub.live" className="text-primary underline">support@sendaclub.live</a>.
            </p>
          </Section>
        </div>

        <footer className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          <p>© 2026 Senda. 18+ only.</p>
          <div className="mt-3 flex items-center justify-center gap-4">
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/billing" className="hover:text-foreground">Billing</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}
