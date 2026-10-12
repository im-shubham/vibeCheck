"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { CopyButton } from "@/components/ui/copy-button";
import { Input, Label, Select } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { WidgetPreview } from "@/components/widgets/widget-preview";
import { api, errMessage } from "@/lib/client-api";
import { rowToInput } from "@/lib/widget-columns";
import { cn } from "@/lib/utils";
import { DEFAULT_SETTINGS, DEMO_TESTIMONIALS, type WidgetTestimonial } from "@/lib/widget/types";
import type { WidgetSettingsInput } from "@/lib/validation";
import type { WidgetRow } from "@/lib/types";

const DEFAULTS: Omit<WidgetSettingsInput, "name"> = { ...DEFAULT_SETTINGS };

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div>
      <p id={`seg-${label}`} className="mb-1.5 text-sm font-medium">
        {label}
      </p>
      <div role="radiogroup" aria-labelledby={`seg-${label}`} className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl border border-line bg-surface-2/60 p-1">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            onClick={() => onChange(o.id)}
            className={cn("rounded-lg px-3 py-2 text-sm transition", value === o.id ? "bg-brand text-white shadow" : "text-muted hover:text-fg")}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm">{label}</span>
      <Switch label={label} checked={checked} onChange={onChange} />
    </div>
  );
}

function Editor({
  widget,
  approved,
  origin,
  onSaved,
  onDelete,
}: {
  widget: WidgetRow;
  approved: WidgetTestimonial[];
  origin: string;
  onSaved: (w: WidgetRow) => void;
  onDelete: () => void;
}) {
  const saved = useMemo(() => rowToInput(widget), [widget]);
  const [draft, setDraft] = useState<WidgetSettingsInput>(saved);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof WidgetSettingsInput>(k: K, v: WidgetSettingsInput[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const demo = approved.length === 0;
  const { name: _name, ...settings } = draft;
  void _name;
  const data = useMemo(() => ({ settings, testimonials: demo ? DEMO_TESTIMONIALS : approved, demo }), [settings.layout, settings.theme, settings.primaryColor, settings.borderRadius, settings.fontFamily, settings.showStars, settings.showReviewerName, settings.showReviewerTitle, settings.maxTestimonials, approved, demo]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    setSaving(true);
    try {
      const res = await api<{ widget: WidgetRow }>(`/api/widgets/${widget.id}`, { method: "PATCH", json: draft });
      onSaved(res.widget);
      toast.success("Widget saved");
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setSaving(false);
    }
  }

  const snippet = `<script\n  src="${origin}/embed.js"\n  data-widget-id="${widget.id}"\n  defer>\n</script>\n<div id="vibecheck-widget"></div>`;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <Card className="space-y-5 self-start">
        <div>
          <Label htmlFor="w-name">Widget name</Label>
          <Input id="w-name" value={draft.name} maxLength={60} onChange={(e) => set("name", e.target.value)} />
        </div>
        <Segmented label="Theme" value={draft.theme} onChange={(v) => set("theme", v)} options={[{ id: "light", label: "Light" }, { id: "dark", label: "Dark" }]} />
        <Segmented
          label="Layout"
          value={draft.layout}
          onChange={(v) => set("layout", v)}
          options={[{ id: "grid", label: "Grid" }, { id: "carousel", label: "Carousel" }, { id: "marquee", label: "Marquee" }]}
        />
        <div>
          <Label htmlFor="w-color">Primary color</Label>
          <div className="flex items-center gap-2">
            <input
              id="w-color"
              type="color"
              value={draft.primaryColor}
              onChange={(e) => set("primaryColor", e.target.value)}
              className="size-11 shrink-0 cursor-pointer rounded-xl border border-line bg-transparent p-1"
              aria-label="Primary color picker"
            />
            <Input
              value={draft.primaryColor}
              onChange={(e) => set("primaryColor", e.target.value)}
              aria-label="Primary color hex"
              maxLength={7}
              spellCheck={false}
              aria-invalid={!/^#[0-9a-fA-F]{6}$/.test(draft.primaryColor)}
              className="font-mono"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="w-radius">Corner radius — {draft.borderRadius}px</Label>
          <input id="w-radius" type="range" min={0} max={32} value={draft.borderRadius} onChange={(e) => set("borderRadius", Number(e.target.value))} className="w-full accent-[var(--brand)]" />
        </div>
        <div>
          <Label htmlFor="w-font">Typography</Label>
          <Select id="w-font" value={draft.fontFamily} onChange={(e) => set("fontFamily", e.target.value as WidgetSettingsInput["fontFamily"])}>
            <option value="sans">Modern sans-serif</option>
            <option value="serif">Classic serif</option>
            <option value="mono">Monospace</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="w-max">Testimonials shown — {draft.maxTestimonials}</Label>
          <input id="w-max" type="range" min={1} max={24} value={draft.maxTestimonials} onChange={(e) => set("maxTestimonials", Number(e.target.value))} className="w-full accent-[var(--brand)]" />
        </div>
        <div className="divide-y divide-line border-t border-line pt-2">
          <ToggleRow label="Show star ratings" checked={draft.showStars} onChange={(v) => set("showStars", v)} />
          <ToggleRow label="Show reviewer name" checked={draft.showReviewerName} onChange={(v) => set("showReviewerName", v)} />
          <ToggleRow label="Show job title & company" checked={draft.showReviewerTitle} onChange={(v) => set("showReviewerTitle", v)} />
        </div>
        <p className="text-xs text-muted">Stars only appear on testimonials where the reviewer left a rating.</p>
        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <Button onClick={save} loading={saving} disabled={!dirty || !/^#[0-9a-fA-F]{6}$/.test(draft.primaryColor) || !draft.name.trim()}>
            <Save className="size-4" /> Save changes
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setDraft({ name: draft.name, ...DEFAULTS });
              toast.info("Defaults restored in the preview — click Save to keep them.");
            }}
          >
            <RotateCcw className="size-4" /> Reset
          </Button>
          <Button variant="ghost" onClick={onDelete} aria-label="Delete widget">
            <Trash2 className="size-4 text-bad" />
          </Button>
        </div>
        {dirty && <p className="text-xs text-warn">You have unsaved changes.</p>}
      </Card>

      <div className="min-w-0 space-y-6">
        <section aria-label="Live preview" className="lg:sticky lg:top-24">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Live preview</h2>
          <div
            className="overflow-hidden rounded-2xl border border-line p-4"
            style={{ background: draft.theme === "dark" ? "#0b0f24" : "#f4f5fb" }}
          >
            <WidgetPreview data={data} />
          </div>
          {demo && <p className="mt-2 text-xs text-muted">You have no approved testimonials yet, so this shows clearly-labelled demo content. Public widgets never show demo content.</p>}
        </section>

        <section id="embed" aria-label="Embed code" className="scroll-mt-24">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Embed on your website</h2>
          <Card className="space-y-3">
            <p className="text-sm text-muted">
              Paste this where you want the widget. It works on any site — no framework needed — and only ever shows <strong className="text-fg">approved</strong> testimonials, using your <strong className="text-fg">saved</strong> settings (changes can take up to a minute to appear).
            </p>
            <pre className="overflow-x-auto rounded-xl border border-line bg-surface-2/60 p-3 text-xs leading-relaxed"><code>{snippet}</code></pre>
            <CopyButton text={snippet} label="Copy embed code" variant="primary" />
          </Card>
        </section>
      </div>
    </div>
  );
}

export function WidgetsClient({ initial, approved, origin, maxWidgets, planName }: { initial: WidgetRow[]; approved: WidgetTestimonial[]; origin: string; maxWidgets: number; planName: string }) {
  const router = useRouter();
  const [widgets, setWidgets] = useState(initial);
  const [selectedId, setSelectedId] = useState(initial[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const selected = widgets.find((w) => w.id === selectedId) ?? null;
  const atLimit = widgets.length >= maxWidgets;

  async function create() {
    setCreating(true);
    try {
      const res = await api<{ widget: WidgetRow }>("/api/widgets", { method: "POST", json: { name: `Widget ${widgets.length + 1}`, ...DEFAULTS } });
      setWidgets((w) => [...w, res.widget]);
      setSelectedId(res.widget.id);
      toast.success("Widget created");
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setCreating(false);
    }
  }

  async function remove() {
    if (!selected) return;
    setDeleting(true);
    try {
      await api(`/api/widgets/${selected.id}`, { method: "DELETE" });
      const rest = widgets.filter((w) => w.id !== selected.id);
      setWidgets(rest);
      setSelectedId(rest[0]?.id ?? null);
      setConfirmDelete(false);
      toast.success("Widget deleted. Any site still embedding it will stop showing testimonials.");
      router.refresh();
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Widgets"
        description="Style your testimonial widget and embed it anywhere."
        actions={
          <Button onClick={create} loading={creating} disabled={atLimit} title={atLimit ? `Your ${planName} plan includes ${maxWidgets} widget${maxWidgets === 1 ? "" : "s"}` : undefined}>
            <Plus className="size-4" /> New widget
          </Button>
        }
      />
      {atLimit && <p className="-mt-3 mb-4 text-xs text-muted">Your {planName} plan includes {maxWidgets} widget{maxWidgets === 1 ? "" : "s"}.</p>}

      {widgets.length > 1 && (
        <div role="tablist" aria-label="Widgets" className="mb-4 flex flex-wrap gap-1.5">
          {widgets.map((w) => (
            <button
              key={w.id}
              role="tab"
              type="button"
              aria-selected={w.id === selectedId}
              onClick={() => setSelectedId(w.id)}
              className={cn("rounded-full border px-3.5 py-1.5 text-sm", w.id === selectedId ? "border-brand bg-brand/15 font-medium" : "border-line text-muted hover:text-fg")}
            >
              {w.name}
            </button>
          ))}
        </div>
      )}

      {selected ? (
        <Editor
          key={selected.id + selected.updated_at}
          widget={selected}
          approved={approved}
          origin={origin}
          onSaved={(w) => setWidgets((all) => all.map((x) => (x.id === w.id ? w : x)))}
          onDelete={() => setConfirmDelete(true)}
        />
      ) : (
        <EmptyState icon={<LayoutGrid className="size-5" />} title="No widgets yet" description="Create a widget to get an embed code for your website." action={<Button onClick={create} loading={creating}>Create widget</Button>} />
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this widget?"
        description="Websites that embed it will stop showing your testimonials. Your testimonials themselves aren't affected."
        loading={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
