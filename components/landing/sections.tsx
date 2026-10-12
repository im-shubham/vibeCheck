import Link from "next/link";
import { BarChart3, Check, Code2, Dices, GripVertical, Heart, MessageSquareQuote, PenLine, Share2, Sparkles, Video, Zap } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LinkButton } from "@/components/ui/button";
import { HostedWidget } from "@/components/widgets/hosted-widget";
import { PLANS } from "@/lib/plans";
import { DEFAULT_SETTINGS, DEMO_TESTIMONIALS } from "@/lib/widget/types";

export function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-6 text-sm text-muted md:flex">
          <a href="#features" className="hover:text-fg">Features</a>
          <a href="#how" className="hover:text-fg">How it works</a>
          <a href="#use-cases" className="hover:text-fg">Use cases</a>
          <a href="#pricing" className="hover:text-fg">Pricing</a>
          <a href="#faq" className="hover:text-fg">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LinkButton href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">Log in</LinkButton>
          <LinkButton href="/signup" size="sm">Sign up</LinkButton>
        </div>
      </div>
    </header>
  );
}

export function Hero() {
  return (
    <section className="bg-hero-glow">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-12 px-4 pb-20 pt-16 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted">
            <Sparkles className="size-3.5 text-brand" aria-hidden /> AI-assisted, never AI-invented
          </p>
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Turn Every Happy Customer Into <span className="text-brand-gradient">Your Best Marketing.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Collect authentic testimonials, make writing effortless with AI, and showcase your best customer stories anywhere on your website.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/signup" size="lg">Start Collecting Testimonials</LinkButton>
            <LinkButton href="#how" variant="secondary" size="lg">See How It Works</LinkButton>
          </div>
          <p className="mt-4 text-sm text-muted">Free plan available. No credit card required.</p>
        </div>

        <div aria-label="Example testimonial widget (demo content)" className="min-w-0 rounded-3xl border border-line bg-surface/70 p-4 shadow-2xl shadow-brand/10 backdrop-blur">
          <HostedWidget
            data={{
              settings: { ...DEFAULT_SETTINGS, layout: "carousel", theme: "dark", maxTestimonials: 4 },
              testimonials: DEMO_TESTIMONIALS,
              demo: true,
            }}
          />
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  { Icon: Zap, title: "Vibe Chips", body: "Profession-specific topic chips give reviewers a gentle starting point, so \"great work\" becomes something specific." },
  { Icon: Sparkles, title: "Magic Polish", body: "Pick a tone and AI tidies the wording. It's told not to add numbers or claims, and reviewers approve every rewrite." },
  { Icon: Dices, title: "Fill-in-the-blanks", body: "Writer's block? Three quick prompts build a first draft the reviewer can edit freely — no AI required." },
  { Icon: Video, title: "Video testimonials", body: "Reviewers record in the browser, preview, and upload straight to your own storage with signed URLs." },
  { Icon: Heart, title: "Wall of Love", body: "Approve what you like, hide the rest, and drag to set the order your best stories appear in." },
  { Icon: Code2, title: "Embeddable widgets", body: "Grid, carousel or marquee. One snippet works on any site and never clashes with your styles." },
  { Icon: BarChart3, title: "Honest analytics", body: "See submissions and widget loads over time. We only show what we actually measure." },
  { Icon: Share2, title: "Your own page", body: "Every creator gets a clean public link to share by email, DM or invoice. Reviewers need no account." },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20">
      <h2 className="text-3xl font-semibold tracking-tight">Everything you need to collect and show social proof</h2>
      <p className="mt-2 max-w-2xl text-muted">Designed to make reviewers actually finish — and to keep every testimonial authentic.</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ Icon, title, body }) => (
          <div key={title} className="rounded-2xl border border-line bg-surface p-5">
            <div className="mb-3 grid size-10 place-items-center rounded-xl bg-brand/15 text-brand">
              <Icon className="size-5" aria-hidden />
            </div>
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm text-muted">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  { Icon: Share2, title: "Share your link", body: "Sign up, tell us your profession, and get a personal collection page with Vibe Chips tailored to your work." },
  { Icon: PenLine, title: "Customers share their story", body: "They write, fill in the blanks, or record a video. AI can help polish — they stay in control of every word." },
  { Icon: MessageSquareQuote, title: "You approve what's published", body: "Nothing goes live until you approve it. Hide or restore any testimonial at any time." },
  { Icon: GripVertical, title: "Embed it anywhere", body: "Style a widget, copy the snippet, and your approved testimonials appear on your site." },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-16 border-y border-line bg-surface/50">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ Icon, title, body }, i) => (
            <li key={title} className="relative rounded-2xl border border-line bg-surface p-5">
              <span className="absolute -top-3 left-5 rounded-full bg-brand-gradient px-2.5 py-0.5 text-xs font-bold text-white">Step {i + 1}</span>
              <Icon className="mb-3 mt-2 size-6 text-brand" aria-hidden />
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const USE_CASES = [
  ["Freelancers & designers", "Send one link after a project wraps and get specific, usable feedback."],
  ["Agencies", "Collect client success stories and keep a curated wall for your pitch deck and site."],
  ["Coaches & educators", "Help students and clients put their experience into words without pressure."],
  ["SaaS founders", "Gather customer quotes and video clips for your landing page."],
  ["Local businesses", "Turn happy regulars into social proof that lives on your own website."],
  ["Consultants", "Showcase client feedback with the role and company that makes it credible."],
];

export function UseCases() {
  return (
    <section id="use-cases" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20">
      <h2 className="text-3xl font-semibold tracking-tight">Built for independent professionals and small teams</h2>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {USE_CASES.map(([t, b]) => (
          <div key={t} className="rounded-2xl border border-line bg-surface p-5">
            <h3 className="font-semibold">{t}</h3>
            <p className="mt-1.5 text-sm text-muted">{b}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-16 border-y border-line bg-surface/50">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-3xl font-semibold tracking-tight">Simple pricing</h2>
        <p className="mt-2 text-muted">Start free. Paid plans are on the way — they&apos;re not purchasable yet.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {Object.values(PLANS).map((p) => (
            <div key={p.id} className={`flex flex-col rounded-2xl border bg-surface p-6 ${p.available ? "border-brand shadow-lg shadow-brand/10" : "border-line"}`}>
              <h3 className="font-semibold">{p.name}</h3>
              <p className="mt-2 text-3xl font-semibold">{p.priceLabel}</p>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-muted">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-good" aria-hidden /> {f}
                  </li>
                ))}
              </ul>
              {p.available ? (
                <LinkButton href="/signup" className="mt-6">Get started free</LinkButton>
              ) : (
                <span className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-line text-sm text-muted">Coming soon</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQ = [
  ["Do my customers need an account?", "No. Reviewers open your link and submit directly. Only you, the creator, need an account."],
  ["Will AI make up things my customers didn't say?", "It's instructed not to, and the server rejects rewrites that introduce new numbers. Reviewers also see the original next to the rewrite and choose which to keep. No tool can guarantee perfect wording, so please read what's published."],
  ["Can testimonials be published without my approval?", "No. Every submission starts as pending and only appears in widgets after you approve it. Hidden and pending testimonials are never served publicly."],
  ["Do I need to be technical to embed the widget?", "You paste one snippet of HTML where you want the widget. It runs in an isolated container so it won't conflict with your site's styles."],
  ["Are video testimonials supported?", "Yes, when video storage (Cloudflare R2 or S3) is connected. Without it, the video option explains that it isn't set up and text reviews continue to work."],
  ["How is the Testimonial Power Meter calculated?", "It's a simple writing guide based on length, detail and outcomes mentioned. It isn't an authenticity check, and reviewers never have to include numbers."],
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-16 px-4 py-20">
      <h2 className="text-3xl font-semibold tracking-tight">Frequently asked questions</h2>
      <div className="mt-8 divide-y divide-line rounded-2xl border border-line bg-surface">
        {FAQ.map(([q, a]) => (
          <details key={q} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
              {q}
              <span className="text-muted transition group-open:rotate-45" aria-hidden>+</span>
            </summary>
            <p className="mt-2 text-sm text-muted">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function Cta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20">
      <div className="rounded-3xl bg-brand-gradient p-10 text-center text-white shadow-2xl shadow-brand/30">
        <h2 className="text-3xl font-semibold tracking-tight">Ready to collect your first testimonial?</h2>
        <p className="mx-auto mt-2 max-w-xl text-white/85">Set up your page in about a minute.</p>
        <Link href="/signup" className="mt-6 inline-flex h-12 items-center rounded-xl bg-white px-6 font-medium text-slate-900 transition hover:bg-white/90">
          Start Collecting Testimonials
        </Link>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:flex-row">
        <Logo />
        <nav aria-label="Footer" className="flex gap-5">
          <a href="#features" className="hover:text-fg">Features</a>
          <a href="#pricing" className="hover:text-fg">Pricing</a>
          <Link href="/login" className="hover:text-fg">Log in</Link>
          <Link href="/signup" className="hover:text-fg">Sign up</Link>
        </nav>
        <p>© {new Date().getFullYear()} VibeCheck</p>
      </div>
    </footer>
  );
}
