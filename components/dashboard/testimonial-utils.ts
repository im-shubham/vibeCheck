import { api } from "@/lib/client-api";
import type { Testimonial, TestimonialStatus } from "@/lib/types";
import { DEFAULT_SETTINGS, type WidgetSettings, type WidgetTestimonial } from "@/lib/widget/types";

export const patchTestimonial = (id: string, body: { status?: TestimonialStatus; contentText?: string }) =>
  api<{ testimonial: Testimonial }>(`/api/testimonials/${id}`, { method: "PATCH", json: body }).then((r) => r.testimonial);

export const deleteTestimonial = (id: string) => api(`/api/testimonials/${id}`, { method: "DELETE" });

export const toWidgetTestimonial = (t: Testimonial): WidgetTestimonial => ({
  id: t.id,
  name: t.reviewer_name,
  title: t.reviewer_title,
  company: t.reviewer_company,
  text: t.content_text,
  imageUrl: t.reviewer_image_url,
  rating: t.rating,
  hasVideo: Boolean(t.video_url),
});

export const approvedSorted = (items: Testimonial[]) =>
  items.filter((t) => t.status === "approved").sort((a, b) => a.sort_order - b.sort_order);

export const settingsOrDefault = (s: WidgetSettings | null): WidgetSettings => s ?? DEFAULT_SETTINGS;
