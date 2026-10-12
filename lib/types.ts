export type TestimonialStatus = "pending" | "approved" | "hidden";
export type WidgetLayout = "grid" | "carousel" | "marquee";
export type WidgetTheme = "light" | "dark";
export type WidgetFont = "sans" | "serif" | "mono";
export type PlanId = "free" | "creator" | "pro";

export interface VibeChip {
  label: string;
  prompt: string;
}

export interface Profile {
  id: string;
  display_name: string;
  business_name: string | null;
  brand_name: string | null;
  profession_niche: string;
  website_url: string | null;
  avatar_url: string | null;
  public_slug: string;
  custom_vibe_chips: VibeChip[];
  plan: PlanId;
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  creator_id: string;
  reviewer_name: string;
  reviewer_title: string | null;
  reviewer_company: string | null;
  reviewer_image_url: string | null;
  content_text: string;
  original_content_text: string | null;
  ai_polished: boolean;
  rating: number | null;
  video_url: string | null;
  status: TestimonialStatus;
  sort_order: number;
  metrics_detected: boolean;
  consent_to_publish: boolean;
  created_at: string;
  updated_at: string;
}

export interface WidgetRow {
  id: string;
  creator_id: string;
  name: string;
  layout: WidgetLayout;
  theme: WidgetTheme;
  primary_color: string;
  border_radius: number;
  font_family: WidgetFont;
  show_stars: boolean;
  show_reviewer_name: boolean;
  show_reviewer_title: boolean;
  max_testimonials: number;
  created_at: string;
  updated_at: string;
}
