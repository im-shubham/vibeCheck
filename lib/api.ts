import "server-only";
import { NextResponse } from "next/server";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const jsonError = (message: string, status: number, extra?: Record<string, unknown>, headers?: HeadersInit) =>
  NextResponse.json({ error: message, ...extra }, { status, headers });

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}

/** Returns a 429 response when the caller exceeded the limit, otherwise null. */
export function limitOrResponse(req: Request, name: string, limit: number, windowMs: number): NextResponse | null {
  const r = rateLimit(`${name}:${clientIp(req)}`, limit, windowMs);
  return r.ok
    ? null
    : jsonError("Too many requests. Please wait a moment and try again.", 429, undefined, {
        "Retry-After": String(r.retryAfter),
      });
}

/** The verified session identity. Never trust a creator id from the request body. */
export async function getAuth() {
  if (!supabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { supabase, user: data.user };
}

export async function readJson(req: Request): Promise<unknown | null> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
