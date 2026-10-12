import { NextResponse } from "next/server";
import { getAuth, jsonError, readJson } from "@/lib/api";
import { reorderSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth) return jsonError("Please sign in.", 401);

  const parsed = reorderSchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError("Invalid order.", 400);
  const ids = [...new Set(parsed.data.ids)];

  // every id must be one of the caller's own approved testimonials (RLS filters the rest out)
  const { data: owned } = await auth.supabase.from("testimonials").select("id").in("id", ids).eq("status", "approved");
  if ((owned?.length ?? 0) !== ids.length) return jsonError("Some testimonials couldn't be found.", 404);

  const { error } = await auth.supabase.rpc("reorder_testimonials", { p_ids: ids });
  if (error) return jsonError("We couldn't save the new order.", 500);
  return NextResponse.json({ ok: true });
}
