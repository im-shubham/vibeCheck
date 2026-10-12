import type { WidgetSettingsInput } from "@/lib/validation";
import type { WidgetRow } from "@/lib/types";
import type { WidgetSettings } from "@/lib/widget/types";

export const widgetToColumns = (v: WidgetSettingsInput) => ({
  name: v.name,
  layout: v.layout,
  theme: v.theme,
  primary_color: v.primaryColor.toLowerCase(),
  border_radius: v.borderRadius,
  font_family: v.fontFamily,
  show_stars: v.showStars,
  show_reviewer_name: v.showReviewerName,
  show_reviewer_title: v.showReviewerTitle,
  max_testimonials: v.maxTestimonials,
});

export const rowToSettings = (w: WidgetRow): WidgetSettings => ({
  layout: w.layout,
  theme: w.theme,
  primaryColor: w.primary_color,
  borderRadius: w.border_radius,
  fontFamily: w.font_family,
  showStars: w.show_stars,
  showReviewerName: w.show_reviewer_name,
  showReviewerTitle: w.show_reviewer_title,
  maxTestimonials: w.max_testimonials,
});

export const rowToInput = (w: WidgetRow): WidgetSettingsInput => ({ name: w.name, ...rowToSettings(w) });
