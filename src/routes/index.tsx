import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Flame, MessageCircle, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Senda — Where creators meet creators" },
      { name: "description", content: "Swipe, match, and collab with verified adult content creators. Built for shoots, promos, and partnerships." },
      { property: "og:title", content: "Senda — Where creators meet creators" },
      { property: "og:description", content: "Swipe, match, and collab with verified adult content creators." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/30 blur-[120px]" />
        <div className="absolute top-1/3 -right-20 h-[400px] w-[400px] rounded-full bg-secondary/20 blur-[100px]" />
      </div>

      <header className="flex items-center justify-between px-6 py-6 md:px-12">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-display text-xl font-bold">s</div>
          <span className="font-display text-2xl font-bold tracking-tight">senda</span>
        </div>
        <Link to="/auth" className="rounded-full border border-border bg-card/50 px-5 py-2 text-sm font-medium backdrop-blur hover:bg-card">
          Sign in
        </Link>
      </header>

      <section className="px-6 pt-12 pb-24 md:px-12 md:pt-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs uppercase tracking-widest text-muted-foreground backdrop-blur">
            <Flame className="h-3.5 w-3.5 text-primary" />
            Creator-to-creator collab network
          </div>
          <h1 className="font-display text-5xl font-bold leading-[1.05] md:text-7xl lg:text-8xl">
            Match. <span className="text-primary">Collab.</span> Create.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Senda is the swipe-and-match app built for adult content creators who want to partner on shoots, cross-promos, and collabs — with verified creators only.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/auth" className="w-full rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-[1.02] sm:w-auto">
              Create your profile
            </Link>
            <Link to="/auth" className="w-full rounded-full border border-border bg-card/50 px-8 py-4 text-base font-semibold backdrop-blur sm:w-auto">
              I already have an account
            </Link>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">18+ only. ID and age verification required to match.</p>
        </div>

        <div className="mx-auto mt-24 grid max-w-5xl gap-4 md:grid-cols-3">
          <Feature icon={<Sparkles className="h-5 w-5" />} title="Curated discovery" body="Find creators by niche, platform, location, and the kind of collab they're after." />
          <Feature icon={<MessageCircle className="h-5 w-5" />} title="Match to message" body="No DM spam. Conversations open only when you both swipe right." />
          <Feature icon={<ShieldCheck className="h-5 w-5" />} title="Verified only" body="Every profile is ID and age verified. No fakes, no minors, no exceptions." />
        </div>
      </section>

      <footer className="border-t border-border/50 px-6 py-8 text-center text-xs text-muted-foreground md:px-12">
        © {new Date().getFullYear()} Senda. Creators only. 18+.
      </footer>
    </main>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card/60 p-6 backdrop-blur">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">{icon}</div>
      <h3 className="font-display text-xl font-bold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
