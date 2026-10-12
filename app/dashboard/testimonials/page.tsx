import { WallClient } from "@/components/dashboard/wall-client";
import { requireCreator } from "@/lib/session";
import { rowToSettings } from "@/lib/widget-columns";
import { DEFAULT_SETTINGS } from "@/lib/widget/types";
import type { Testimonial, WidgetRow } from "@/lib/types";

export const metadata = { title: "Wall of Love" };

export default async function WallPage() {
  const { supabase } = await requireCreator();
  const [{ data: approved }, { data: widget }] = await Promise.all([
    supabase.from("testimonials").select("*").eq("status", "approved").order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
    supabase.from("widgets").select("*").order("created_at", { ascending: true }).limit(1).maybeSingle(),
  ]);
  const w = widget as WidgetRow | null;
  return (
    <WallClient
      initial={(approved ?? []) as Testimonial[]}
      widgetSettings={w ? rowToSettings(w) : DEFAULT_SETTINGS}
      publicWidgetId={w?.id ?? null}
    />
  );
}
