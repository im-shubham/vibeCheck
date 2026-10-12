"use client";

import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExternalLink, EyeOff, GripVertical, Heart } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button, LinkButton } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/card";
import { Modal } from "@/components/ui/dialog";
import { WidgetPreview } from "@/components/widgets/widget-preview";
import { patchTestimonial, toWidgetTestimonial } from "./testimonial-utils";
import { api, errMessage } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import type { Testimonial } from "@/lib/types";
import type { WidgetSettings } from "@/lib/widget/types";

function SortableRow({ t, busy, onHide, onPreview }: { t: Testimonial; busy: boolean; onHide: () => void; onPreview: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: t.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex items-start gap-3 rounded-2xl border border-line bg-surface p-4", isDragging && "z-10 border-brand shadow-2xl shadow-brand/20")}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${t.reviewer_name}. Press space to pick up, arrow keys to move, space to drop.`}
        className="mt-1 cursor-grab touch-none rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-fg active:cursor-grabbing"
      >
        <GripVertical className="size-5" />
      </button>
      <Avatar name={t.reviewer_name} src={t.reviewer_image_url} />
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {t.reviewer_name}
          <span className="font-normal text-muted">{[t.reviewer_title, t.reviewer_company].filter(Boolean).length ? ` · ${[t.reviewer_title, t.reviewer_company].filter(Boolean).join(", ")}` : ""}</span>
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{t.content_text || "Video testimonial"}</p>
        <div className="mt-2 flex gap-1">
          <Button size="sm" variant="ghost" onClick={onPreview}>
            Preview
          </Button>
          <Button size="sm" variant="ghost" onClick={onHide} loading={busy}>
            <EyeOff className="size-4" /> Hide
          </Button>
        </div>
      </div>
    </li>
  );
}

export function WallClient({ initial, widgetSettings, publicWidgetId }: { initial: Testimonial[]; widgetSettings: WidgetSettings; publicWidgetId: string | null }) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState<Testimonial | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const previous = items;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    const next = arrayMove(items, from, to);
    setItems(next); // move immediately so dragging feels right…
    setSaving(true);
    try {
      await api("/api/testimonials/reorder", { method: "POST", json: { ids: next.map((i) => i.id) } });
      toast.success("Order saved");
    } catch (err) {
      setItems(previous); // …but roll back visibly if the database didn't accept it
      toast.error(`${errMessage(err)} The previous order was restored.`);
    } finally {
      setSaving(false);
    }
  }

  async function hide(t: Testimonial) {
    setBusy(t.id);
    try {
      await patchTestimonial(t.id, { status: "hidden" });
      setItems((all) => all.filter((x) => x.id !== t.id));
      toast.success("Hidden — find it in your Inbox under Hidden.");
    } catch (err) {
      toast.error(errMessage(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Wall of Love"
        description="Your approved testimonials. Drag to choose the order they appear in your widgets."
        actions={
          publicWidgetId && (
            <LinkButton href={`/w/${publicWidgetId}`} target="_blank" variant="secondary" size="sm">
              <ExternalLink className="size-4" /> View public widget
            </LinkButton>
          )
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-5" />}
          title="Nothing on your wall yet"
          description="Approve testimonials in your Inbox and they'll appear here, ready to arrange."
          action={<LinkButton href="/dashboard/inbox">Go to Inbox</LinkButton>}
        />
      ) : (
        <>
          <p className="mb-3 text-xs text-muted" aria-live="polite">
            {saving ? "Saving order…" : `${items.length} approved · widgets show them in this order, up to each widget's limit.`}
          </p>
          <DndContext id="wall-dnd" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2">
                {items.map((t) => (
                  <SortableRow key={t.id} t={t} busy={busy === t.id} onHide={() => hide(t)} onPreview={() => setPreviewing(t)} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </>
      )}

      <Modal open={!!previewing} onClose={() => setPreviewing(null)} title="Preview" className="max-w-xl">
        {previewing && (
          <div className="rounded-xl p-3" style={{ background: widgetSettings.theme === "dark" ? "#0b0f24" : "#f4f5fb" }}>
            <WidgetPreview data={{ settings: { ...widgetSettings, layout: "grid" }, testimonials: [toWidgetTestimonial(previewing)] }} />
          </div>
        )}
      </Modal>
    </>
  );
}
