import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { OnboardingForm } from "@/components/dashboard/onboarding-form";
import { createClient } from "@/lib/supabase/server";
import { appUrl } from "@/lib/utils";

export const metadata: Metadata = { title: "Set up your page" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/onboarding");

  const { data: profile } = await supabase.from("profiles").select("id").eq("id", data.user.id).maybeSingle();
  if (profile) redirect("/dashboard");

  const defaultName = (data.user.email ?? "").split("@")[0].replace(/[._-]+/g, " ");
  return (
    <AuthShell title="Let's set up your page" subtitle="This takes about a minute. You can change everything later.">
      <OnboardingForm userId={data.user.id} defaultName={defaultName} origin={appUrl()} />
    </AuthShell>
  );
}
