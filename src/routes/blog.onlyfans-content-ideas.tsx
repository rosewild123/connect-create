import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Lightbulb, Users, EyeOff, Shirt, Mars, Megaphone, Camera, Sparkles } from "lucide-react";

const URL = "https://sendaclub.live/blog/onlyfans-content-ideas";
const TITLE = "70+ OnlyFans content ideas that actually sell — Senda";
const DESCRIPTION =
  "Fresh OnlyFans content ideas for every creator: solo, collab, faceless, non-nude, male creators, and promo content. Plus how to keep ideas flowing without burning out.";

export const Route = createFileRoute("/blog/onlyfans-content-ideas")({
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
          headline: "70+ OnlyFans content ideas that actually sell",
          description: DESCRIPTION,
          mainEntityOfPage: URL,
          author: { "@type": "Organization", name: "Senda" },
          publisher: { "@type": "Organization", name: "Senda" },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Can you do OnlyFans without showing your face?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes. Many successful creators run a faceless OnlyFans using body-focused shots, hands, silhouettes, masks, or voice-only content. The key is consistency and a recognisable aesthetic so subscribers know what to expect.",
              },
            },
            {
              "@type": "Question",
              name: "What are the best OnlyFans content ideas for beginners?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Start with solo content you can shoot yourself: mirror photos, themed outfits, behind-the-scenes clips, and personalised messages. Add PPV bundles early. Once you're comfortable, collabs with other verified creators are the fastest way to grow.",
              },
            },
          ],
        }),
      },
    ],
  }),
  component: ContentIdeasPage,
});

const CATEGORIES = [
  {
    icon: Lightbulb,
    title: "Solo content ideas",
    intro: "The foundation of every creator's page. Mix these so your feed never looks repetitive.",
    ideas: [
      "Themed outfit sets — lingerie, cosplay, gym wear, streetwear, one new theme each week",
      "Mirror selfies and bathroom teasers for the free feed, fuller sets behind the paywall",
      "Getting-ready routines — hair, makeup, outfit, the full transformation on video",
      "Bedroom POV shots and pillow-talk style clips shot from your perspective",
      "Seasonal and holiday content — Valentine's, summer, Halloween costumes, Christmas lingerie",
      "Personalised name shoutouts and custom voice notes as PPV",
      "Throwback Thursday — repost a favourite older set with a new angle or outtake",
      "Morning routine / bedtime routine vlogs — subscribers love the intimacy of daily life",
    ],
  },
  {
    icon: Users,
    title: "Collab content ideas",
    intro: "Collabs are the single fastest growth lever — one duo scene puts you in front of another creator's entire subscriber base. This is what Senda is built for.",
    ideas: [
      "Duo photo sets with a creator in a complementary niche (e.g. fitness + glamour, cosplay + alt)",
      "Joint PPV video scenes — split the revenue and double the audience",
      "Cross-promo shoutout exchanges — each of you posts a teaser tagging the other",
      "Behind-the-scenes collab vlogs showing the shoot day from setup to wrap",
      "Q&A or interview-style videos where you interview each other (great for engagement)",
      "Matching themed sets — both of you shoot the same concept and cross-post",
      "Photographer collabs — bring in a verified photographer for a professional-quality set",
      "Content trade — swap footage so both of you get fresh material from one shoot",
    ],
  },
  {
    icon: EyeOff,
    title: "Faceless content ideas",
    intro: "A faceless OnlyFans is entirely viable — these niches have large, loyal audiences. The trick is a consistent aesthetic so your content is recognisable without a face.",
    ideas: [
      "Body-focused photography — legs, back, shoulders, hands, silhouette against light",
      "Hands-only content — jewellery, nail art, lotion application, fabric against skin",
      "Silhouette and shadow shots using window light or a single lamp",
      "Masked or blindfold content that keeps the mystery while showing body",
      "Neck-down mirror photos with creative framing",
      "ASMR-style audio clips with minimal or no visuals — voice, breathing, whispers",
      "Feet and footwear content (one of the most searched niches on the platform)",
      "Wardrobe-focused content — trying on outfits, lingerie hauls, all framed from the chin down",
    ],
  },
  {
    icon: Shirt,
    title: "Non-nude content ideas",
    intro: "Non-nude OnlyFans accounts are a real and growing niche. These ideas sell on personality, aesthetics, and the tease of what's almost visible.",
    ideas: [
      "Implied nudity — strategically covered with hands, sheets, or props",
      "Wet white shirt / wet t-shirt content — classic for a reason",
      "Lingerie and bikini try-on hauls with reviews",
      "Yoga and stretching videos in activewear",
      "Pool and beach content during summer months",
      "Towel-after-shower teasers — the 'just got out' look",
      "Underwear drawer tours and collection showcases",
      "Roleplay scenarios that stay clothed — secretary, teacher, gym instructor characters",
    ],
  },
  {
    icon: Mars,
    title: "Content ideas for men on OnlyFans",
    intro: "OnlyFans for men is a growing market. Male creators who niche down and post consistently build loyal subscriber bases — the audience is there, the competition is lower.",
    ideas: [
      "Fitness and physique content — gym sessions, flexing, transformation progress",
      "Grooming routines — beard care, skincare, haircut reveals",
      "Couples content with a partner (the highest-earning category for male creators)",
      "Suit and formalwear content — there's a big audience for well-dressed men",
      "Dom/roleplay content in character (boss, coach, strict partner archetypes)",
      "Voice content — deep-voice readings, bedtime stories, motivational pep talks",
      "Lifestyle and day-in-the-life vlogs showing personality beyond the body",
      "Collabs with female creators — cross-promo content that taps both audiences",
    ],
  },
  {
    icon: Megaphone,
    title: "Promo content ideas",
    intro: "OnlyFans promo content is what fills the free feed and pulls people to the paywall. Think of it as the trailer, not the film.",
    ideas: [
      "Cropped teasers — a 3-second clip from a 10-minute PPV video",
      "Before-and-after comparison posts showing the transformation",
      "Countdown posts — 'New set drops in 24 hours' with a sneak peek",
      "Polls and questions — 'Which outfit should I shoot next?' drives engagement",
      "Story-style clips that disappear in 24 hours if your platform supports it",
      "Caption this — post a provocative photo and ask subscribers to caption it",
      "Subscriber milestone celebrations — 'We hit 1k, here's a freebie'",
      "Cross-platform teasers — post a SFW clip on socials pointing to the full version",
    ],
  },
];

const FAQS = [
  {
    q: "Can you do OnlyFans without showing your face?",
    a: "Yes. Many successful creators run a faceless OnlyFans using body-focused shots, hands, silhouettes, masks, or voice-only content. The key is consistency and a recognisable aesthetic so subscribers know what to expect — pick a style and stick with it.",
  },
  {
    q: "What are the best OnlyFans content ideas for beginners?",
    a: "Start with solo content you can shoot yourself: mirror photos, themed outfits, behind-the-scenes clips, and personalised messages. Add PPV bundles early. Once you're comfortable, collabs with other verified creators are the fastest way to grow — one duo scene can put you in front of a whole new audience.",
  },
  {
    q: "How often should I post on OnlyFans?",
    a: "Most successful creators post on the free feed daily and drop a PPV bundle 2–3 times per week. The free feed keeps subscribers engaged between paid drops. Consistency matters more than volume — a predictable schedule trains subscribers to check back.",
  },
  {
    q: "How do I find creators to collab with?",
    a: "That's exactly what Senda is for — a swipe-and-match app for verified adult content creators, filtered by niche, platform, location, and the type of collab you're after. Every profile is ID and age verified before they can match, so you're not cold-DMing strangers or risking catfish.",
  },
];

function ContentIdeasPage() {
  return (
    <main className="min-h-screen px-6 py-8 md:px-12">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Senda
        </Link>

        <h1 className="mt-8 font-display text-4xl font-bold leading-tight md:text-5xl">
          70+ OnlyFans content ideas that actually sell
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Running out of ideas is the number one reason creators post less — and posting less is the number one reason
          subscribers churn. Here are 70+ fresh OnlyFans content ideas across every category, from solo basics to collabs,
          faceless niches, non-nude content, and ideas for male creators. Use them as a menu, not a checklist.
        </p>

        {/* Quick category nav */}
        <div className="mt-8 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <a
              key={c.title}
              href={`#${c.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              className="rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs font-medium text-muted-foreground hover:bg-card hover:text-foreground"
            >
              {c.title}
            </a>
          ))}
        </div>

        {/* Collab highlight — this is Senda's pitch */}
        <section className="mt-8 rounded-3xl border border-primary/30 bg-primary/10 p-6">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="font-display text-2xl font-bold">The one idea that grows your page fastest</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Every idea below works. But collabs — shooting with another verified creator — are the single fastest way to
            grow. One duo scene or cross-promo puts you in front of their entire subscriber base for free. The catch is
            finding someone real, verified, and in a complementary niche. That's exactly what{" "}
            <Link to="/auth" className="font-semibold text-primary underline">Senda</Link> is built for.
          </p>
        </section>

        {/* Content idea categories */}
        <div className="mt-10 space-y-8">
          {CATEGORIES.map((cat) => (
            <section key={cat.title} id={cat.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}>
              <div className="mb-4 flex items-center gap-3">
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <cat.icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold">{cat.title}</h2>
                  <p className="text-sm text-muted-foreground">{cat.intro}</p>
                </div>
              </div>
              <ul className="space-y-2.5">
                {cat.ideas.map((idea, i) => (
                  <li key={i} className="flex gap-3 rounded-2xl border border-border bg-card/60 p-3.5">
                    <span className="mt-0.5 text-primary">•</span>
                    <span className="text-sm text-foreground/90">{idea}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Posting tips */}
        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold">How to keep ideas flowing (and actually post them)</h2>
          <div className="mt-4 space-y-4 text-sm text-muted-foreground">
            <p>
              <span className="font-semibold text-foreground">Batch shoot.</span> Set aside one day a week to shoot 3–4
              sets at once. You'll never stare at a blank feed again — just grab a finished set from your library and
              schedule it.
            </p>
            <p>
              <span className="font-semibold text-foreground">Rotate categories.</span> Don't post five lingerie sets in
              a row. Rotate between solo, themed, behind-the-scenes, and PPV so the feed stays varied. Subscribers notice
              variety and stay longer.
            </p>
            <p>
              <span className="font-semibold text-foreground">How to post on OnlyFans effectively.</span> Post something
              on the free feed daily to stay visible, then drop a PPV bundle 2–3 times per week. The free content is the
              trailer — the PPV is the film. A consistent, predictable schedule trains subscribers to check back.
            </p>
            <p>
              <span className="font-semibold text-foreground">Ask your subscribers.</span> Run a poll: "Which theme
              should I shoot next?" The winning option is your next set — and the people who voted are primed to buy it.
            </p>
            <p>
              <span className="font-semibold text-foreground">Collab regularly.</span> Every collab gives you a week of
              content — the shoot itself, the behind-the-scenes, teasers, and the finished set. One collab partner can
              fill your calendar.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold">Frequently asked questions</h2>
          <div className="mt-4 space-y-4">
            {FAQS.map((faq) => (
              <div key={faq.q} className="rounded-2xl border border-border bg-card/60 p-5">
                <h3 className="font-semibold text-foreground">{faq.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="mt-10 rounded-3xl border border-border bg-card p-6 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <h2 className="font-display text-2xl font-bold">Find your next collab partner</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Senda is the swipe-and-match app for verified adult content creators. Filter by niche, platform, location,
            and the type of collab you want. No DM spam — you only talk when you both swipe right.
          </p>
          <Link
            to="/auth"
            className="mt-5 inline-block rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/30"
          >
            Create your profile
          </Link>
          <p className="mt-3 text-xs text-muted-foreground">Verified creators only. 18+. ID verification required.</p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <Link to="/terms" className="hover:text-foreground">Terms</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          <Link to="/blog/how-to-find-onlyfans-collaborators" className="hover:text-foreground">
            How to find collab partners
          </Link>
        </div>
      </div>
    </main>
  );
}
