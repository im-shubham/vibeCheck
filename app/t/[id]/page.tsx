import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { adminConfigured, createAdminClient } from "@/lib/supabase/admin";
import { uuidSchema } from "@/lib/validation";
import { Logo } from "@/components/ui/logo";
import { LinkButton } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Thank you", robots: { index: false } };

/**
 * Confirmation page. The id is an unguessable UUID, but the page still reveals NO testimonial
 * content or reviewer details — only the creator's public name and whether it's live.
 */
export default async function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let creatorName: string | null = null;
  let live = false;

  if (uuidSchema.safeParse(id).success && adminConfigured()) {
    const { data } = await createAdminClient()
      .from("testimonials")
      .select("status, profiles!inner(display_name)")
      .eq("id", id)
      .maybeSingle();
    if (data) {
      const profile = data.profiles as unknown as { display_name: string } | { display_name: string }[];
      creatorName = (Array.isArray(profile) ? profile[0] : profile)?.display_name ?? null;
      live = data.status === "approved";
    }
  }

  return (
    <main className="bg-hero-glow flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md rounded-3xl border border-line bg-surface p-8 shadow-2xl shadow-black/20">
        <CheckCircle2 className="mx-auto size-14 text-good" aria-hidden />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Thank you for sharing your experience!</h1>
        <p className="mt-2 text-muted">
          {live
            ? `${creatorName ?? "The creator"} has already approved your testimonial.`
            : `Your testimonial has been submitted for review${creatorName ? ` by ${creatorName}` : ""}. It will only be published once they approve it.`}
        </p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <LinkButton href="/" variant="secondary">
            Learn about VibeCheck
          </LinkButton>
          <Link href="/signup" className="text-sm text-brand hover:underline">
            Collect testimonials of your own
          </Link>
        </div>
      </div>
      <div className="mt-8 opacity-70">
        <Logo />
      </div>
    </main>
  );
}
