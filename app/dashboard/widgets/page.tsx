import { WidgetsClient } from "@/components/dashboard/widgets-client";
import { toWidgetTestimonial } from "@/components/dashboard/testimonial-utils";
import { requireCreator } from "@/lib/session";
import { planOf } from "@/lib/plans";
import { appUrl } from "@/lib/utils";
import type { Testimonial, WidgetRow } from "@/lib/types";

export const metadata = { title: "Widgets" };

export default async function WidgetsPage() {
  const { supabase, profile } = await requireCreator();
  const [{ data: widgets }, { data: approved }] = await Promise.all([
    supabase.from("widgets").select("*").order("created_at", { ascending: true }),
    supabase.from("testimonials").select("*").eq("status", "approved").order("sort_order", { ascending: true }).limit(24),
  ]);
  const plan = planOf(profile.plan);
  return (
    <WidgetsClient
      initial={(widgets ?? []) as WidgetRow[]}
      approved={((approved ?? []) as Testimonial[]).map(toWidgetTestimonial)}
      origin={appUrl()}
      maxWidgets={plan.widgets}
      planName={plan.name}
    />
  );
}
