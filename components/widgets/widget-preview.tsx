"use client";

import { useEffect, useRef } from "react";
import { mountWidget } from "@/lib/widget/render";
import type { WidgetData, WidgetHandle } from "@/lib/widget/types";

/**
 * React wrapper around the framework-free renderer — the exact code the embed script runs,
 * so the dashboard preview and the public widget cannot drift apart. It renders inside a
 * Shadow DOM, so widget theme settings never restyle the dashboard.
 */
export function WidgetPreview({ data, className }: { data: WidgetData; className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const handle = useRef<WidgetHandle | null>(null);
  const latest = useRef(data);

  useEffect(() => {
    latest.current = data;
  });

  useEffect(() => {
    if (!hostRef.current) return;
    handle.current = mountWidget(hostRef.current, latest.current);
    return () => {
      handle.current?.destroy();
      handle.current = null;
    };
  }, []);

  useEffect(() => {
    handle.current?.update(data);
  }, [data]);

  return <div ref={hostRef} className={className} />;
}
