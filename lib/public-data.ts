import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VibeChip } from "@/lib/types";
import type { WidgetData, WidgetTestimonial } from "@/lib/widget/types";

/**
 * All anonymous reads go through here. The service-role client bypasses RLS, so every
 * query selects an explicit allow-list of public columns and filters on status.
 */

export interface PublicCreator {
  id: string; // server-side only — strip before sending to the browser
  plan: string;
  displayName: string;
  brandName: string | null;
  businessName: string | null;
  profession: string;
  avatarUrl: string | null;
  chips: VibeChip[];
  slug: string;
}

export async function getPublicCreator(slug: string): Promise<PublicCreator | null> {
  const { data } = await createAdminClient()
    .from("profiles")
    .select("id, plan, display_name, brand_name, business_name, profession_niche, avatar_url, custom_vibe_chips, public_slug")
    .eq("public_slug", slug)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    plan: data.plan,
    displayName: data.display_name,
    brandName: data.brand_name,
    businessName: data.business_name,
    profession: data.profession_niche,
    avatarUrl: data.avatar_url,
    chips: Array.isArray(data.custom_vibe_chips) ? (data.custom_vibe_chips as VibeChip[]) : [],
    slug: data.public_slug,
  };
}

/** Approved + consented testimonials only, with public fields only. Hidden/pending never leave the DB. */
export async function getPublicWidget(widgetId: string): Promise<WidgetData | null> {
  const admin = createAdminClient();
  const { data: w } = await admin
    .from("widgets")
    .select("id, creator_id, layout, theme, primary_color, border_radius, font_family, show_stars, show_reviewer_name, show_reviewer_title, max_testimonials")
    .eq("id", widgetId)
    .maybeSingle();
  if (!w) return null;

  const { data: rows } = await admin
    .from("testimonials")
    .select("id, reviewer_name, reviewer_title, reviewer_company, reviewer_image_url, content_text, rating, video_url")
    .eq("creator_id", w.creator_id)
    .eq("status", "approved")
    .eq("consent_to_publish", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(w.max_testimonials);

  const testimonials: WidgetTestimonial[] = (rows ?? []).map((r) => ({
    id: r.id,
    name: r.reviewer_name,
    title: r.reviewer_title,
    company: r.reviewer_company,
    text: r.content_text,
    imageUrl: r.reviewer_image_url,
    rating: r.rating,
    hasVideo: Boolean(r.video_url),
  }));

  return {
    settings: {
      layout: w.layout,
      theme: w.theme,
      primaryColor: w.primary_color,
      borderRadius: w.border_radius,
      fontFamily: w.font_family,
      showStars: w.show_stars,
      showReviewerName: w.show_reviewer_name,
      showReviewerTitle: w.show_reviewer_title,
      maxTestimonials: w.max_testimonials,
    },
    testimonials,
  };
}
