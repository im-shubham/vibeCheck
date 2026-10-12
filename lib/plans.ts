import type { PlanId } from "./types";

// KEEP IN SYNC with public.plan_widget_limit() in supabase/migrations/0001_init.sql
export interface PlanDef {
  id: PlanId;
  name: string;
  priceLabel: string;
  available: boolean;
  testimonials: number;
  widgets: number;
  aiPerMonth: number;
  features: string[];
}

export const PLANS: Record<PlanId, PlanDef> = {
  free: {
    id: "free",
    name: "Free",
    priceLabel: "$0",
    available: true,
    testimonials: 50,
    widgets: 1,
    aiPerMonth: 30,
    features: ["Public collection page", "Text & video testimonials", "1 widget", "30 AI requests / month"],
  },
  creator: {
    id: "creator",
    name: "Creator",
    priceLabel: "$12/mo",
    available: false,
    testimonials: 500,
    widgets: 5,
    aiPerMonth: 300,
    features: ["Everything in Free", "5 widgets", "300 AI requests / month", "500 testimonials"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceLabel: "$29/mo",
    available: false,
    testimonials: 5000,
    widgets: 25,
    aiPerMonth: 1500,
    features: ["Everything in Creator", "25 widgets", "1,500 AI requests / month", "5,000 testimonials"],
  },
};

export const planOf = (id: string | null | undefined): PlanDef =>
  id && id in PLANS ? PLANS[id as PlanId] : PLANS.free;
