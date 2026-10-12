"use client";

import { WidgetPreview } from "./widget-preview";
import type { WidgetData } from "@/lib/widget/types";

export function HostedWidget({ data }: { data: WidgetData }) {
  return <WidgetPreview data={data} />;
}
