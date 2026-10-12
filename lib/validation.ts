import { z } from "zod";

export const RESERVED_SLUGS = new Set([
  "admin", "api", "app", "login", "signup", "dashboard", "submit", "settings", "billing", "embed",
  "www", "help", "support", "auth", "onboarding", "vibecheck",
]);

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/, "Use 3–40 characters: lowercase letters, numbers and hyphens.")
  .refine((s) => !RESERVED_SLUGS.has(s) && !s.includes("--"), "That URL is not available.");

export const slugify = (input: string): string =>
  input.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

const urlOrEmpty = z
  .string()
  .trim()
  .max(300)
  .optional()
  .nullable()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^https?:\/\/[^\s]+\.[^\s]+$/i.test(v), "Enter a valid http(s) URL.");

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Enter your name.").max(80),
  businessName: optionalText(120),
  brandName: optionalText(80),
  professionNiche: z.string().trim().min(2, "Tell us your profession or niche.").max(120),
  websiteUrl: urlOrEmpty,
  avatarUrl: optionalText(500),
  publicSlug: slugSchema,
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const vibeChipSchema = z.object({
  label: z.string().trim().min(2).max(32),
  prompt: z.string().trim().min(5).max(140),
});
export const vibeChipsSchema = z.array(vibeChipSchema).length(5);

export const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex color.");

export const widgetSettingsSchema = z.object({
  name: z.string().trim().min(1).max(60),
  layout: z.enum(["grid", "carousel", "marquee"]),
  theme: z.enum(["light", "dark"]),
  primaryColor: hexColor,
  borderRadius: z.number().int().min(0).max(32),
  fontFamily: z.enum(["sans", "serif", "mono"]),
  showStars: z.boolean(),
  showReviewerName: z.boolean(),
  showReviewerTitle: z.boolean(),
  maxTestimonials: z.number().int().min(1).max(24),
});
export type WidgetSettingsInput = z.infer<typeof widgetSettingsSchema>;

export const TONES = ["professional", "hype", "storyteller"] as const;
export type Tone = (typeof TONES)[number];

export const MAX_TESTIMONIAL_CHARS = 3000;

export const polishSchema = z.object({
  slug: slugSchema,
  text: z
    .string()
    .trim()
    .min(20, "Write a little more before polishing (at least 20 characters).")
    .max(MAX_TESTIMONIAL_CHARS),
  tone: z.enum(TONES),
});

export const madLibsAnswersSchema = z.object({
  need: z.string().trim().min(2).max(120),
  appreciated: z.string().trim().min(2).max(120),
  changed: z.string().trim().min(2).max(160),
});
export const madLibsAiSchema = z.object({
  slug: slugSchema,
  answers: madLibsAnswersSchema,
});

export const vibeChipsRequestSchema = z.object({
  profession: z.string().trim().min(2).max(120),
  niche: z.string().trim().max(120).optional().default(""),
  audience: z.string().trim().max(200).optional().default(""),
  allowFallback: z.boolean().optional().default(false),
});

const urlField = z.string().url().max(500).optional().nullable();

export const submissionSchema = z
  .object({
    slug: slugSchema,
    submissionKey: z.string().uuid(),
    reviewerName: z.string().trim().min(1, "Please enter your name.").max(100),
    reviewerTitle: optionalText(100),
    reviewerCompany: optionalText(100),
    reviewerImageUrl: urlField,
    text: z.string().trim().max(MAX_TESTIMONIAL_CHARS, "That's a bit long — please keep it under 3,000 characters."),
    originalText: z.string().trim().max(MAX_TESTIMONIAL_CHARS).optional().nullable(),
    aiPolished: z.boolean().optional().default(false),
    rating: z.number().int().min(1).max(5).optional().nullable(),
    videoUrl: urlField,
    consent: z.literal(true, { message: "Please confirm you're happy for this to be published." }),
    website: z.string().max(200).optional(), // honeypot
  })
  .refine((v) => v.text.length >= 10 || !!v.videoUrl, {
    path: ["text"],
    message: "Please write at least a sentence or two (10+ characters), or record a video.",
  });
export type SubmissionInput = z.infer<typeof submissionSchema>;

export const testimonialPatchSchema = z
  .object({
    status: z.enum(["pending", "approved", "hidden"]).optional(),
    contentText: z.string().trim().min(1).max(MAX_TESTIMONIAL_CHARS).optional(),
  })
  .refine((v) => v.status !== undefined || v.contentText !== undefined, "Nothing to update.");

export const reorderSchema = z.object({ ids: z.array(z.string().uuid()).min(1).max(500) });

export const uuidSchema = z.string().uuid();
