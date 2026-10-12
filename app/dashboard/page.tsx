import Link from "next/link";
import { CheckCircle2, Clock, Eye, Inbox, Link2, MessageSquareQuote, Palette, Share2 } from "lucide-react";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { LinkButton } from "@/components/ui/button";
import { requireCreator } from "@/lib/session";
import { appUrl, formatDate } from "@/lib/utils";
import type { Testimonial } from "@/lib/types";

export const metadata = { title: "Overview" };

const daysAgoIso = (days: number) => new Date(Date.now() - days * 86400_000).toISOString();

export default async function OverviewPage() {
  const { supabase, profile } = await requireCreator();
  const since = daysAgoIso(30);

  const count = (status?: string) => {
    const q = supabase.from("testimonials").select("id", { count: "exact", head: true });
    return (status ? q.eq("status", status) : q).then((r) => r.count ?? 0);
  };
  const [total, pending, approved, recent, widgets] = await Promise.all([
    count(),
    count("pending"),
    count("approved"),
    supabase.from("testimonials").select("*").order("created_at", { ascending: false }).limit(5).then((r) => (r.data ?? []) as Testimonial[]),
    supabase.from("widgets").select("id").then((r) => (r.data ?? []).map((w) => w.id as string)),
  ]);
  const { count: impressions } = widgets.length
    ? await supabase.from("widget_events").select("id", { count: "exact", head: true }).eq("event_type", "impression").gte("created_at", since)
    : { count: 0 };

  const link = `${appUrl()}/submit/${profile.public_slug}`;
  const stats = [
    { label: "Total testimonials", value: total, Icon: MessageSquareQuote, tone: "text-brand" },
    { label: "Pending review", value: pending, Icon: Clock, tone: "text-warn" },
    { label: "Approved", value: approved, Icon: CheckCircle2, tone: "text-good" },
    { label: "Widget loads (30 days)", value: impressions ?? 0, Icon: Eye, tone: "text-sky-400" },
  ];

  return (
    <>
      <PageHeader title={`Welcome back, ${profile.display_name.split(" ")[0]}`} description="Here's what's happening with your testimonials." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, Icon, tone }) => (
          <Card key={label} className="p-4">
            <Icon className={`size-5 ${tone}`} aria-hidden />
            <p className="mt-3 text-3xl font-semibold tabular-nums">{value.toLocaleString()}</p>
            <p className="text-xs text-muted">{label}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Link2 className="size-4 text-brand" aria-hidden /> Your collection link
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <code className="min-w-0 flex-1 truncate rounded-xl border border-line bg-surface-2/60 px-3.5 py-2.5 text-sm">{link}</code>
          <div className="flex gap-2">
            <CopyButton text={link} label="Copy link" />
            <LinkButton href={`/submit/${profile.public_slug}`} target="_blank" variant="ghost" size="sm" className="h-auto">
              <Share2 className="size-4" /> Open
            </LinkButton>
          </div>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section aria-labelledby="recent">
          <h2 id="recent" className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Recent submissions
          </h2>
          {recent.length === 0 ? (
            <EmptyState
              icon={<Inbox className="size-5" />}
              title="No testimonials yet"
              description="Share your collection link with a happy customer — their submission will show up here for review."
              action={<CopyButton text={link} label="Copy collection link" variant="secondary" />}
            />
          ) : (
            <ul className="space-y-2">
              {recent.map((t) => (
                <li key={t.id}>
                  <Link href="/dashboard/inbox" className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 transition hover:border-brand/50">
                    <Avatar name={t.reviewer_name} src={t.reviewer_image_url} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-medium">{t.reviewer_name}</span>
                        <StatusBadge status={t.status} />
                        <span className="text-xs text-muted">{formatDate(t.created_at)}</span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted">{t.content_text || "Video testimonial"}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside aria-labelledby="quick">
          <h2 id="quick" className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Quick actions
          </h2>
          <div className="space-y-2">
            <LinkButton href="/dashboard/inbox" variant="secondary" className="w-full justify-start">
              <Inbox className="size-4" /> Review inbox {pending > 0 && `(${pending})`}
            </LinkButton>
            <LinkButton href="/dashboard/widgets" variant="secondary" className="w-full justify-start">
              <Palette className="size-4" /> Customize widget
            </LinkButton>
            <LinkButton href="/dashboard/settings" variant="secondary" className="w-full justify-start">
              <Link2 className="size-4" /> Edit page &amp; Vibe Chips
            </LinkButton>
          </div>
        </aside>
      </div>
    </>
  );
}
