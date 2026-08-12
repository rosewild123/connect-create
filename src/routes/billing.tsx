import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { BOOST_SINGLE_PRICE_LABEL } from "@/lib/senda";

export const Route = createFileRoute("/billing")({
  head: () => ({
    meta: [
      { title: "Billing, Refunds & Cancellation — Senda" },
      {
        name: "description",
        content:
          "Senda billing terms: subscription prices, billing descriptor, renewal dates, how to cancel, and how refunds are handled.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Billing, Refunds & Cancellation — Senda" },
      {
        property: "og:description",
        content: "Subscription prices, renewals, cancellation and refund terms for Senda.",
      },
      { property: "og:url", content: "https://sendaclub.live/billing" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Billing, Refunds & Cancellation — Senda" },
      {
        name: "twitter:description",
        content: "Subscription prices, renewals, cancellation and refund terms for Senda.",
      },
    ],
    links: [{ rel: "canonical", href: "https://sendaclub.live/billing" }],
  }),
  component: BillingPage,
});

function BillingPage() {
  return (
    <main className="min-h-screen px-6 py-8 md:px-12">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Senda
        </Link>
        <h1 className="mt-6 font-display text-3xl font-bold">Billing, Refunds &amp; Cancellation</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: August 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <Section title="What we charge">
            <table className="mt-2 w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border text-foreground">
                  <th className="py-2 pr-4 font-semibold">Product</th>
                  <th className="py-2 pr-4 font-semibold">Price</th>
                  <th className="py-2 font-semibold">Billing</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">Senda Plus</td>
                  <td className="py-2 pr-4">£11.99 GBP</td>
                  <td className="py-2">Monthly, recurring until cancelled</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4">Senda Premium</td>
                  <td className="py-2 pr-4">£24.99 GBP</td>
                  <td className="py-2">Monthly, recurring until cancelled</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Single profile boost</td>
                  <td className="py-2 pr-4">{BOOST_SINGLE_PRICE_LABEL} GBP</td>
                  <td className="py-2">One-off, non-recurring</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-3">
              All prices are in pounds sterling (GBP) and include any applicable VAT or sales tax, which is calculated
              at checkout based on your billing location. Senda does not sell, host, or resell explicit media, and no
              purchase on Senda unlocks sexual content — paid plans only change how your own profile is surfaced to
              other members.
            </p>
          </Section>

          <Section title="How the charge appears on your statement">
            <p>
              Payments are collected by our authorised payment processor acting as reseller or payment agent. Your card
              or bank statement will show a descriptor from that processor rather than the word &ldquo;Senda&rdquo;. The
              exact descriptor is shown to you on the payment page before you confirm, and again on your emailed
              receipt. If you see a charge you do not recognise, email us with the last four digits of the card and the
              date and we will identify it for you.
            </p>
          </Section>

          <Section title="Renewals">
            <p>
              Subscriptions renew automatically each month on the same calendar day as your original purchase, at the
              price shown above, until you cancel. Your next renewal date is always visible on the Upgrade page inside
              the app. We will email you before any price change and you may cancel before it takes effect.
            </p>
          </Section>

          <Section title="How to cancel">
            <p>You can cancel at any time, and cancelling is always free:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Open the app, go to <span className="text-foreground">Profile → Upgrade → Manage subscription</span>.</li>
              <li>
                Or email <a href="mailto:support@sendaclub.live" className="text-primary underline">support@sendaclub.live</a> from
                your account email address and we will cancel it for you.
              </li>
              <li>Or contact our payment processor's consumer support directly using the details on your receipt.</li>
            </ul>
            <p className="mt-2">
              Cancellation stops all future charges. You keep your paid features until the end of the billing period you
              have already paid for. Deleting your Senda account also cancels any active subscription.
            </p>
          </Section>

          <Section title="Refunds">
            <p>
              We aim to resolve every billing complaint rather than leave you to dispute a charge. Refunds are issued
              in the following cases:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Duplicate or accidental charges — refunded in full.</li>
              <li>Unauthorised use of your card — refunded in full and the account is closed.</li>
              <li>
                A paid feature did not work and we could not fix it — refunded in full for the affected billing period.
              </li>
              <li>
                Cancellation requests made within 14 days of a first purchase where the paid features were not
                meaningfully used — refunded in full, in line with UK consumer rights.
              </li>
            </ul>
            <p className="mt-2">
              Outside those cases, partial months are not refunded, because access continues to the end of the period.
              Refund requests are answered within 3 business days and, once approved, are returned to the original
              payment method within 5–10 business days.
            </p>
          </Section>

          <Section title="Chargebacks">
            <p>
              Please contact us before raising a chargeback — it is faster for you and cheaper for us. Accounts with an
              open chargeback are suspended until it is resolved, and accounts that repeatedly charge back after using
              paid features may be permanently closed.
            </p>
          </Section>

          <Section title="Billing support">
            <p>
              Email <a href="mailto:support@sendaclub.live" className="text-primary underline">support@sendaclub.live</a>.
              We answer billing enquiries within 3 business days. Please include your account email and the date and
              amount of the charge.
            </p>
          </Section>
        </div>

        <footer className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          <p>© 2026 Senda. 18+ only.</p>
          <div className="mt-3 flex items-center justify-center gap-4">
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/compliance" className="hover:text-foreground">Compliance</Link>
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
