import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SubmitForm } from "@/components/submit/submit-form";
import { adminConfigured } from "@/lib/supabase/admin";
import { getPublicCreator } from "@/lib/public-data";
import { slugSchema } from "@/lib/validation";
import { videoConfigured } from "@/lib/storage/video";

export const dynamic = "force-dynamic";

async function load(slugParam: string) {
  const slug = slugSchema.safeParse(slugParam);
  if (!slug.success || !adminConfigured()) return null;
  return getPublicCreator(slug.data);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const creator = await load((await params).slug);
  return {
    title: creator ? `Share your experience with ${creator.displayName}` : "Share your experience",
    robots: { index: false },
  };
}

export default async function SubmitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!adminConfigured()) {
    return (
      <main className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">This page isn&apos;t available yet</h1>
          <p className="mt-2 max-w-sm text-sm text-muted">The site owner still needs to finish connecting the database.</p>
        </div>
      </main>
    );
  }
  const creator = await load(slug);
  if (!creator) notFound();

  // strip server-only fields (id, plan) before handing data to the browser
  return (
    <SubmitForm
      videoEnabled={videoConfigured()}
      creator={{
        slug: creator.slug,
        displayName: creator.displayName,
        brandName: creator.brandName,
        businessName: creator.businessName,
        profession: creator.profession,
        avatarUrl: creator.avatarUrl,
        chips: creator.chips,
      }}
    />
  );
}
