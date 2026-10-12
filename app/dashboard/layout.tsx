import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/shell";
import { requireCreator } from "@/lib/session";
import { planOf } from "@/lib/plans";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s · VibeCheck" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const { supabase, profile } = await requireCreator();
  const { count } = await supabase.from("testimonials").select("id", { count: "exact", head: true }).eq("status", "pending");

  return (
    <DashboardShell
      pending={count ?? 0}
      profile={{
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        slug: profile.public_slug,
        planName: planOf(profile.plan).name,
      }}
    >
      {children}
    </DashboardShell>
  );
}
