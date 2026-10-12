import { InboxClient } from "@/components/dashboard/inbox-client";
import { requireCreator } from "@/lib/session";
import { rowToSettings } from "@/lib/widget-columns";
import { DEFAULT_SETTINGS } from "@/lib/widget/types";
import { appUrl } from "@/lib/utils";
import type { Testimonial, WidgetRow } from "@/lib/types";

export const metadata = { title: "Inbox" };

export default async function InboxPage() {
  const { supabase, profile } = await requireCreator();
  const [{ data: testimonials }, { data: widget }] = await Promise.all([
    supabase.from("testimonials").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("widgets").select("*").order("created_at", { ascending: true }).limit(1).maybeSingle(),
  ]);

  return (
    <InboxClient
      initial={(testimonials ?? []) as Testimonial[]}
      link={`${appUrl()}/submit/${profile.public_slug}`}
      widgetSettings={widget ? rowToSettings(widget as WidgetRow) : DEFAULT_SETTINGS}
    />
  );
}
