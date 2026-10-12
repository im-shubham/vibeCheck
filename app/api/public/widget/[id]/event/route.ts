import { NextResponse } from "next/server";
import { adminConfigured, createAdminClient } from "@/lib/supabase/admin";
import { clientIp } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { uuidSchema } from "@/lib/validation";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const OPTIONS = () => new NextResponse(null, { status: 204, headers: CORS });

/** Records a widget LOAD (impression). It is not a unique-visitor measurement. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!uuidSchema.safeParse(id).success) return new NextResponse(null, { status: 404, headers: CORS });
  if (!adminConfigured()) return new NextResponse(null, { status: 503, headers: CORS });

  // at most 30 recorded loads per IP per widget per minute — blunts inflation attempts
  if (!rateLimit(`widget-event:${id}:${clientIp(req)}`, 30, 60_000).ok) {
    return new NextResponse(null, { status: 204, headers: CORS });
  }
  const { error } = await createAdminClient().from("widget_events").insert({ widget_id: id, event_type: "impression" });
  return new NextResponse(null, { status: error ? 404 : 204, headers: CORS });
}
