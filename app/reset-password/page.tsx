import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetForm } from "@/components/auth/auth-forms";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  if (supabaseConfigured()) {
    const { data } = await (await createClient()).auth.getUser();
    if (!data.user) redirect("/login?error=link"); // recovery session missing/expired
  }
  return (
    <AuthShell title="Choose a new password">
      <ResetForm />
    </AuthShell>
  );
}
