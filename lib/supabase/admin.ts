import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* eslint-disable @typescript-eslint/no-explicit-any */
// No generated DB types in this repo: rows are validated/mapped at the call sites.
type Admin = SupabaseClient<any, "public", any>;
let cached: Admin | null = null;

/** Service-role client. Bypasses RLS — server-only, and only ever select explicit public fields. */
export function createAdminClient(): Admin {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service role is not configured");
  cached = createClient<any, "public", any>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return cached;
}

export const adminConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
