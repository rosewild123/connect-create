import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Senda" },
      { name: "description", content: "Senda Privacy Policy. Learn how we collect, use, and protect your personal data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="min-h-screen px-6 py-8 md:px-12">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Senda
        </Link>
        <h1 className="mt-6 font-display text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: June 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <Section title="1. Who We Are">
            <p>Senda is a platform that helps adult content creators discover and collaborate with each other. This policy explains how we collect, use, store, and share your personal data when you use our app and services.</p>
          </Section>

          <Section title="2. What We Collect">
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>Account data:</strong> email address, password hash, authentication provider tokens.</li>
              <li><strong>Profile data:</strong> display name, bio, date of birth, location, photos, niches, platforms, and prompts.</li>
              <li><strong>Verification data:</strong> government ID documents and selfies submitted for age and identity verification. These are processed by our verification partner and stored securely.</li>
              <li><strong>Activity data:</strong> swipes, matches, messages, boosts, subscriptions, and device tokens for push notifications.</li>
              <li><strong>Technical data:</strong> IP address, device type, operating system, and app usage analytics.</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Data">
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>To provide and improve the Senda service (matching, messaging, discovery).</li>
              <li>To verify your age and identity and enforce our 18+ policy.</li>
              <li>To process payments and manage subscriptions.</li>
              <li>To send you push notifications, match alerts, and service updates.</li>
              <li>To detect fraud, abuse, and violations of our terms.</li>
              <li>To comply with legal obligations and respond to lawful requests.</li>
            </ul>
          </Section>

          <Section title="4. How We Share Your Data">
            <p>We do not sell your personal data. We may share it with:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>Service providers:</strong> payment processors, identity verification vendors, cloud hosting, and analytics partners.</li>
              <li><strong>Other users:</strong> your profile information (excluding contact details) is visible to matched or discoverable users according to your settings.</li>
              <li><strong>Legal authorities:</strong> when required by law or to protect safety.</li>
            </ul>
          </Section>

          <Section title="5. Data Retention">
            <p>We retain your data for as long as your account is active. If you delete your account, we remove your profile, photos, messages, and personal data within 30 days, except where we must retain it for legal compliance, fraud prevention, or enforcing our terms. Anonymized analytics data may be kept longer.</p>
          </Section>

          <Section title="6. Your Rights">
            <p>Depending on your location, you may have the right to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Access, correct, or delete your personal data.</li>
              <li>Export your data in a machine-readable format.</li>
              <li>Object to or restrict certain processing activities.</li>
              <li>Withdraw consent for optional data uses (e.g., marketing).</li>
            </ul>
            <p className="mt-2">To exercise these rights, contact us at <a href="mailto:support@senda.app" className="text-primary underline">support@senda.app</a> or use the <strong>Export your data</strong> and <strong>Delete account</strong> features in Settings.</p>
          </Section>

          <Section title="7. Cookies & Tracking">
            <p>We use essential cookies to keep you signed in and maintain security. We also use analytics cookies to understand how the app is used. You can control non-essential cookies through your device and browser settings.</p>
          </Section>

          <Section title="8. Security">
            <p>We implement industry-standard measures to protect your data, including encryption in transit and at rest, access controls, and regular security reviews. However, no system is completely secure, and we cannot guarantee absolute security.</p>
          </Section>

          <Section title="9. International Transfers">
            <p>Your data may be stored and processed in the United States or other countries where our service providers operate. We use appropriate safeguards (such as Standard Contractual Clauses) to protect your data during international transfers.</p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. Material changes will be communicated via email or in-app notice. Continued use of Senda after changes constitutes acceptance.</p>
          </Section>

          <Section title="11. Contact Us">
            <p>If you have questions or concerns about this Privacy Policy or our data practices, please contact us at <a href="mailto:support@senda.app" className="text-primary underline">support@senda.app</a>.</p>
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
