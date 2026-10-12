import type { Metadata } from "next";
import { AuthLink, AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to manage your testimonials."
      footer={
        <>
          New to VibeCheck? <AuthLink href="/signup">Create an account</AuthLink>
        </>
      }
    >
      {error === "link" && (
        <p role="alert" className="mb-4 rounded-xl border border-bad/40 bg-bad/10 p-3 text-sm text-bad">
          That link has expired or was already used. Please try again.
        </p>
      )}
      <LoginForm next={next} />
    </AuthShell>
  );
}
