export interface WidgetSettings {
  layout: "grid" | "carousel" | "marquee";
  theme: "light" | "dark";
  primaryColor: string;
  borderRadius: number;
  fontFamily: "sans" | "serif" | "mono";
  showStars: boolean;
  showReviewerName: boolean;
  showReviewerTitle: boolean;
  maxTestimonials: number;
}

/** The ONLY testimonial fields that ever reach a public widget. */
export interface WidgetTestimonial {
  id: string;
  name: string;
  title: string | null;
  company: string | null;
  text: string;
  imageUrl: string | null;
  rating: number | null;
  hasVideo?: boolean;
}

export interface WidgetData {
  settings: WidgetSettings;
  testimonials: WidgetTestimonial[];
  /** true when the items are sample content, not real customer reviews */
  demo?: boolean;
}

export const DEFAULT_SETTINGS: WidgetSettings = {
  layout: "grid",
  theme: "light",
  primaryColor: "#7c5cff",
  borderRadius: 16,
  fontFamily: "sans",
  showStars: true,
  showReviewerName: true,
  showReviewerTitle: true,
  maxTestimonials: 6,
};

/** Clearly-labelled sample content for empty states. Never served by the public API. */
export const DEMO_TESTIMONIALS: WidgetTestimonial[] = [
  { id: "demo-1", name: "Sample Reviewer", title: "Marketing Lead, Example Co.", company: null, rating: 5, imageUrl: null, text: "This is demo content. Approved testimonials from your customers will appear here, styled with your settings." },
  { id: "demo-2", name: "Another Sample", title: "Founder, Demo Studio", company: null, rating: 5, imageUrl: null, text: "Clear communication and careful work throughout. (Demo content — not a real review.)" },
  { id: "demo-3", name: "Placeholder Person", title: "Freelance Writer", company: null, rating: 4, imageUrl: null, text: "A friendly, easy process from start to finish. (Demo content — not a real review.)" },
  { id: "demo-4", name: "Sample Customer", title: null, company: null, rating: null, imageUrl: null, text: "Demo content shows how longer testimonials wrap inside each card so you can check spacing before real reviews arrive." },
];

export interface WidgetHandle {
  update(data: WidgetData): void;
  destroy(): void;
}
