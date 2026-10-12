import { PageHeader } from "@/components/ui/card";
import { SettingsClient } from "@/components/dashboard/settings-client";
import { aiConfigured } from "@/lib/ai/client";
import { requireCreator } from "@/lib/session";
import { appUrl } from "@/lib/utils";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { profile } = await requireCreator();
  return (
    <>
      <PageHeader title="Settings" description="Your profile, public page and Vibe Chips." />
      <SettingsClient profile={profile} origin={appUrl()} aiAvailable={aiConfigured()} />
    </>
  );
}
