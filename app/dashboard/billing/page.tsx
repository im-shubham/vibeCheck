import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { requireCreator } from "@/lib/session";
import { PLANS, planOf } from "@/lib/plans";
import { cn } from "@/lib/utils";

export const metadata = { title: "Billing" };

function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="tabular-nums text-muted">
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={limit} aria-valuenow={used} className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div className={cn("h-full rounded-full", pct >= 90 ? "bg-warn" : "bg-brand")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function BillingPage() {
  const { supabase, profile } = await requireCreator();
  const plan = planOf(profile.plan);
  const period = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();

  const [t, w, ai] = await Promise.all([
    supabase.from("testimonials").select("id", { count: "exact", head: true }).then((r) => r.count ?? 0),
    supabase.from("widgets").select("id", { count: "exact", head: true }).then((r) => r.count ?? 0),
    supabase.from("ai_usage").select("request_count").gte("period_start", period).then((r) => (r.data ?? []).reduce((s, x) => s + (x.request_count as number), 0)),
  ]);

  return (
    <>
      <PageHeader title="Billing" description="Your plan and usage." />
      <div className="grid max-w-4xl gap-4">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm text-muted">Current plan</p>
              <p className="text-2xl font-semibold">{plan.name}</p>
            </div>
            <Badge className="border-good/40 bg-good/15 text-good">Active</Badge>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Meter label="Testimonials" used={t} limit={plan.testimonials} />
            <Meter label="Widgets" used={w} limit={plan.widgets} />
            <Meter label="AI requests this month" used={ai} limit={plan.aiPerMonth} />
          </div>
          <p className="mt-4 text-xs text-muted">Limits are enforced on the server. AI usage resets on the 1st of each month (UTC).</p>
        </Card>

        <section aria-labelledby="plans">
          <h2 id="plans" className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Plans
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            {Object.values(PLANS).map((p) => (
              <Card key={p.id} className={cn(p.id === plan.id && "border-brand")}>
                <p className="font-semibold">{p.name}</p>
                <p className="mt-1 text-2xl font-semibold">{p.priceLabel}</p>
                <ul className="mt-3 space-y-1.5 text-sm text-muted">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-good" aria-hidden /> {f}
                    </li>
                  ))}
                </ul>
                <Button className="mt-4 w-full" variant="secondary" disabled>
                  {p.id === plan.id ? "Current plan" : "Coming soon"}
                </Button>
              </Card>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            Paid plans aren&apos;t available yet — payments haven&apos;t been connected, so nothing here can be purchased. Prices shown are placeholders.
          </p>
        </section>
      </div>
    </>
  );
}
