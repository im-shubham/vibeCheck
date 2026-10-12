import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HostedWidget } from "@/components/widgets/hosted-widget";
import { adminConfigured } from "@/lib/supabase/admin";
import { getPublicWidget } from "@/lib/public-data";
import { uuidSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Testimonials", robots: { index: false } };

/** Hosted view of a public widget — the same renderer and the same public-only data as the embed. */
export default async function HostedWidgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success || !adminConfigured()) notFound();
  const data = await getPublicWidget(id);
  if (!data) notFound();
  return (
    <main
      className="min-h-screen p-4 sm:p-8"
      style={{ background: data.settings.theme === "dark" ? "#0b0f24" : "#f4f5fb", color: data.settings.theme === "dark" ? "#fff" : "#14172b" }}
    >
      <div className="mx-auto max-w-5xl">
        <HostedWidget data={data} />
      </div>
    </main>
  );
}
