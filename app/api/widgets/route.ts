import { NextResponse } from "next/server";
import { getAuth, jsonError, readJson } from "@/lib/api";
import { widgetSettingsSchema } from "@/lib/validation";
import { widgetToColumns } from "@/lib/widget-columns";
import { planOf } from "@/lib/plans";

export async function POST(req: Request) {
  const auth = await getAuth();
  if (!auth) return jsonError("Please sign in.", 401);

  const parsed = widgetSettingsSchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid settings.", 400);

  const { data, error } = await auth.supabase
    .from("widgets")
    .insert({ creator_id: auth.user.id, ...widgetToColumns(parsed.data) })
    .select("*")
    .single();

  if (error) {
    if (error.message.includes("widget_limit_reached")) {
      const { data: p } = await auth.supabase.from("profiles").select("plan").eq("id", auth.user.id).maybeSingle();
      const plan = planOf(p?.plan);
      return jsonError(`Your ${plan.name} plan includes ${plan.widgets} widget${plan.widgets === 1 ? "" : "s"}.`, 403, { code: "widget_limit" });
    }
    return jsonError("We couldn't create the widget.", 500);
  }
  return NextResponse.json({ widget: data }, { status: 201 });
}
