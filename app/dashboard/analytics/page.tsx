import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { DailyChart, type DayPoint } from "@/components/dashboard/analytics-charts";
import { requireCreator } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata = { title: "Analytics" };
const RANGES = [7, 30, 90];

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range } = await searchParams;
  const days = RANGES.includes(Number(range)) ? Number(range) : 30;
  const { supabase } = await requireCreator();

  const count = (status: string) =>
    supabase.from("testimonials").select("id", { count: "exact", head: true }).eq("status", status).then((r) => r.count ?? 0);

  const [series, pending, approved] = await Promise.all([
    supabase.rpc("analytics_daily", { p_days: days }),
    count("pending"),
    count("approved"),
  ]);

  const data: DayPoint[] = ((series.data ?? []) as { day: string; submissions: number; impressions: number }[]).map((r) => ({
    day: r.day,
    submissions: Number(r.submissions),
    impressions: Number(r.impressions),
  }));
  const submissions = data.reduce((s, d) => s + d.submissions, 0);
  const loads = data.reduce((s, d) => s + d.impressions, 0);

  const kpis = [
    { label: `Submissions (last ${days} days)`, value: submissions, note: "Testimonials received through your link" },
    { label: "Pending now", value: pending, note: "Waiting for your review" },
    { label: "Approved now", value: approved, note: "Eligible to appear in widgets" },
    { label: `Widget loads (last ${days} days)`, value: loads, note: "Times a widget loaded on a page — not unique visitors" },
  ];

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Only what VibeCheck actually measures."
        actions={
          <div role="group" aria-label="Date range" className="flex gap-1 rounded-xl border border-line bg-surface p-1">
            {RANGES.map((r) => (
              <Link
                key={r}
                href={`/dashboard/analytics?range=${r}`}
                aria-current={r === days ? "true" : undefined}
                className={cn("rounded-lg px-3 py-1.5 text-sm", r === days ? "bg-brand text-white" : "text-muted hover:text-fg")}
              >
                {r} days
              </Link>
            ))}
          </div>
        }
      />

      {series.error && (
        <p role="alert" className="mb-4 rounded-xl border border-bad/40 bg-bad/10 p-3 text-sm text-bad">
          Couldn&apos;t load the daily series. Make sure the latest database migration has been applied.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <p className="text-3xl font-semibold tabular-nums">{k.value.toLocaleString()}</p>
            <p className="mt-1 text-sm font-medium">{k.label}</p>
            <p className="mt-1 text-xs text-muted">{k.note}</p>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-medium">Submissions per day</h2>
          {submissions === 0 ? (
            <EmptyState icon={<BarChart3 className="size-5" />} title="No submissions in this range" description="Share your collection link to start collecting." />
          ) : (
            <DailyChart data={data} dataKey="submissions" color="#a78bfa" label="Submissions" />
          )}
        </Card>
        <Card>
          <h2 className="mb-3 font-medium">Widget loads per day</h2>
          {loads === 0 ? (
            <EmptyState icon={<BarChart3 className="size-5" />} title="No widget loads yet" description="Once your embed is live on a page, each page load is counted here." />
          ) : (
            <DailyChart data={data} dataKey="impressions" color="#34d399" label="Widget loads" />
          )}
        </Card>
      </div>
      <p className="mt-4 text-xs text-muted">
        Link clicks and unique visitors aren&apos;t tracked, so they&apos;re not shown. Widget loads are counted once per embed page view, with per-IP rate limiting.
      </p>
    </>
  );
}
