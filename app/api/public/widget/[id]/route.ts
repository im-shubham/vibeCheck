import { NextResponse } from "next/server";
import { adminConfigured } from "@/lib/supabase/admin";
import { getPublicWidget } from "@/lib/public-data";
import { limitOrResponse } from "@/lib/api";
import { uuidSchema } from "@/lib/validation";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export const OPTIONS = () => new NextResponse(null, { status: 204, headers: CORS });

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!uuidSchema.safeParse(id).success) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: CORS });
  }
  const limited = limitOrResponse(req, "widget-read", 240, 60_000);
  if (limited) {
    Object.entries(CORS).forEach(([k, v]) => limited.headers.set(k, v));
    return limited;
  }
  if (!adminConfigured()) return NextResponse.json({ error: "Unavailable" }, { status: 503, headers: CORS });

  const data = await getPublicWidget(id);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404, headers: CORS });

  return NextResponse.json(data, {
    headers: { ...CORS, "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
