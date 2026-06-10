import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Senda" },
      { name: "description", content: "Senda Terms of Service. Read the rules and conditions for using our creator collaboration platform." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="min-h-screen px-6 py-8 md:px-12">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Senda
        </Link>
        <h1 className="mt-6 font-display text-3xl font-bold">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: June 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <Section title="1. Eligibility">
            <p>Senda is strictly for adults aged 18 and over. By creating an account, you confirm that you are at least 18 years old and have the legal capacity to enter into these terms. We do not permit minors on the platform under any circumstances.</p>
          </Section>

          <Section title="2. Account & Verification">
            <p>You are responsible for maintaining the confidentiality of your login credentials. We may require government-issued ID verification and a selfie check to confirm your identity and age. Accounts found to be fraudulent, misleading, or operated by minors will be terminated immediately.</p>
          </Section>

          <Section title="3. Acceptable Use">
            <p>You agree not to use Senda to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Harass, abuse, stalk, or threaten any other user.</li>
              <li>Share illegal, non-consensual, or exploitative content.</li>
              <li>Impersonate another person or misrepresent your affiliation.</li>
              <li>Scrape, mine, or otherwise extract data from the platform.</li>
              <li>Promote escort services, prostitution, or human trafficking.</li>
            </ul>
          </Section>

          <Section title="4. Content & Moderation">
            <p>You retain ownership of the content you post. By posting, you grant Senda a limited license to display it on the platform. We reserve the right to remove content and suspend accounts that violate these terms or our community guidelines. We may monitor messages and profiles for safety and compliance.</p>
          </Section>

          <Section title="5. Subscriptions & Payments">
            <p>Paid subscriptions are processed through our payment partner. Subscription fees are non-refundable except where required by law. You may cancel at any time; cancellation takes effect at the end of the current billing period. We may change pricing with reasonable notice.</p>
          </Section>

          <Section title="6. Termination">
            <p>Either you or Senda may terminate your account at any time. Upon termination, your profile, photos, matches, and messages will be deleted in accordance with our data retention policy. Provisions that by their nature should survive termination will remain in effect.</p>
          </Section>

          <Section title="7. Disclaimers & Limitation of Liability">
            <p>Senda is provided "as is" without warranties of any kind. We do not guarantee that you will find matches or that all users are accurately represented. To the maximum extent permitted by law, our liability is limited to the amount you paid us in the 12 months preceding the claim, or $100 if you did not pay.</p>
          </Section>

          <Section title="8. Governing Law">
            <p>These terms are governed by the laws of the State of California, USA, without regard to conflict-of-law principles. Any dispute will be resolved through binding arbitration in San Francisco, CA, except that either party may seek injunctive relief in court.</p>
          </Section>

          <Section title="9. Changes to Terms">
            <p>We may update these terms from time to time. We will notify you of material changes via email or in-app notice. Continued use of Senda after changes constitutes acceptance.</p>
          </Section>

          <Section title="10. Contact">
            <p>Questions about these terms? Email us at <a href="mailto:support@senda.app" className="text-primary underline">support@senda.app</a>.</p>
          </Section>
        </div>

        <footer className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Senda. All rights reserved.</p>
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
