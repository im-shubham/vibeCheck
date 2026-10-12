import { NextResponse } from "next/server";
import { adminConfigured, createAdminClient } from "@/lib/supabase/admin";
import { getPublicCreator } from "@/lib/public-data";
import { jsonError, limitOrResponse, readJson } from "@/lib/api";
import { submissionSchema } from "@/lib/validation";
import { evaluatePower } from "@/lib/power-meter";
import { planOf } from "@/lib/plans";
import { supabasePublicPrefix } from "@/lib/storage/images";
import { videoConfigured, videoPublicPrefix } from "@/lib/storage/video";

export async function POST(req: Request) {
  const limited = limitOrResponse(req, "submit", 5, 10 * 60_000);
  if (limited) return limited;
  if (!adminConfigured()) return jsonError("Submissions aren't available right now.", 503);

  const body = await readJson(req);
  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Please check your answers.", 400, {
      field: parsed.error.issues[0]?.path[0],
    });
  }
  const v = parsed.data;

  // Honeypot: bots fill hidden fields. Pretend success, store nothing.
  if (v.website) return NextResponse.json({ id: crypto.randomUUID() });

  const creator = await getPublicCreator(v.slug);
  if (!creator) return jsonError("This collection page doesn't exist.", 404);

  // Only accept media URLs that WE issued — no arbitrary remote URLs.
  if (v.reviewerImageUrl && !v.reviewerImageUrl.startsWith(supabasePublicPrefix("reviewer-images"))) {
    return jsonError("That profile image isn't valid. Please re-upload it.", 400, { field: "reviewerImageUrl" });
  }
  if (v.videoUrl && !(videoConfigured() && v.videoUrl.startsWith(videoPublicPrefix()))) {
    return jsonError("That video isn't valid. Please record it again.", 400, { field: "videoUrl" });
  }

  const admin = createAdminClient();

  const { count } = await admin.from("testimonials").select("id", { count: "exact", head: true }).eq("creator_id", creator.id);
  if ((count ?? 0) >= planOf(creator.plan).testimonials) {
    return jsonError("This page isn't accepting new testimonials right now.", 403);
  }

  const polished = v.aiPolished && v.originalText && v.originalText !== v.text;
  const { data, error } = await admin
    .from("testimonials")
    .insert({
      creator_id: creator.id, // derived from the slug server-side
      reviewer_name: v.reviewerName,
      reviewer_title: v.reviewerTitle,
      reviewer_company: v.reviewerCompany,
      reviewer_image_url: v.reviewerImageUrl ?? null,
      content_text: v.text,
      original_content_text: polished ? v.originalText : null,
      ai_polished: Boolean(polished),
      rating: v.rating ?? null,
      video_url: v.videoUrl ?? null,
      status: "pending",
      metrics_detected: evaluatePower(v.text).metricsDetected,
      consent_to_publish: true,
      submission_key: v.submissionKey,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      // Same submission key → a double-click or retry. Return the original, don't duplicate.
      const { data: existing } = await admin
        .from("testimonials")
        .select("id")
        .eq("submission_key", v.submissionKey)
        .eq("creator_id", creator.id)
        .maybeSingle();
      if (existing) return NextResponse.json({ id: existing.id, duplicate: true });
    }
    console.error("[submit] insert failed", error.code);
    return jsonError("We couldn't save your testimonial. Please try again.", 500);
  }
  return NextResponse.json({ id: data.id }, { status: 201 });
}
