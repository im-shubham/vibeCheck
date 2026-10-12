import { NextResponse } from "next/server";
import { getAuth, jsonError, readJson } from "@/lib/api";
import { uuidSchema, widgetSettingsSchema } from "@/lib/validation";
import { widgetToColumns } from "@/lib/widget-columns";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!uuidSchema.safeParse(id).success) return jsonError("Not found.", 404);
  const auth = await getAuth();
  if (!auth) return jsonError("Please sign in.", 401);

  const parsed = widgetSettingsSchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid settings.", 400);

  const { data, error } = await auth.supabase
    .from("widgets")
    .update(widgetToColumns(parsed.data))
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) return jsonError("We couldn't save the widget.", 500);
  if (!data) return jsonError("Widget not found.", 404);
  return NextResponse.json({ widget: data });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!uuidSchema.safeParse(id).success) return jsonError("Not found.", 404);
  const auth = await getAuth();
  if (!auth) return jsonError("Please sign in.", 401);

  const { data, error } = await auth.supabase.from("widgets").delete().eq("id", id).select("id");
  if (error) return jsonError("We couldn't delete the widget.", 500);
  if (!data?.length) return jsonError("Widget not found.", 404);
  return NextResponse.json({ ok: true });
}
