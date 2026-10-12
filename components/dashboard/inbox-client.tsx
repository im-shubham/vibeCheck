"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, EyeOff, Inbox, Pencil, Play, RotateCcw, Search, Sparkles, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/card";
import { ConfirmDialog, Modal } from "@/components/ui/dialog";
import { CopyButton } from "@/components/ui/copy-button";
import { Label, Textarea } from "@/components/ui/field";
import { WidgetPreview } from "@/components/widgets/widget-preview";
import { approvedSorted, deleteTestimonial, patchTestimonial, toWidgetTestimonial } from "./testimonial-utils";
import { errMessage } from "@/lib/client-api";
import { evaluatePower } from "@/lib/power-meter";
import { cn, formatDate } from "@/lib/utils";
import { DEMO_TESTIMONIALS, type WidgetSettings } from "@/lib/widget/types";
import { MAX_TESTIMONIAL_CHARS } from "@/lib/validation";
import type { Testimonial, TestimonialStatus } from "@/lib/types";

type Filter = "all" | TestimonialStatus;
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "hidden", label: "Hidden" },
];

export function InboxClient({ initial, link, widgetSettings }: { initial: Testimonial[]; link: string; widgetSettings: WidgetSettings }) {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [editText, setEditText] = useState("");
  const [previewing, setPreviewing] = useState<Testimonial | null>(null);
  const [deleting, setDeleting] = useState<Testimonial | null>(null);

  const counts = useMemo(() => {
    const c = { all: items.length, pending: 0, approved: 0, hidden: 0 };
    items.forEach((t) => c[t.status]++);
    return c;
  }, [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (t) =>
        (filter === "all" || t.status === filter) &&
        (!q || t.reviewer_name.toLowerCase().includes(q) || t.content_text.toLowerCase().includes(q) || (t.reviewer_company ?? "").toLowerCase().includes(q)),
    );
  }, [items, filter, query]);

  const approved = useMemo(() => approvedSorted(items), [items]);
  const previewData = useMemo(
    () =>
      approved.length
        ? { settings: widgetSettings, testimonials: approved.map(toWidgetTestimonial) }
        : { settings: widgetSettings, testimonials: DEMO_TESTIMONIALS, demo: true },
    [approved, widgetSettings],
  );

  // Updates the UI only after the server confirms — never ahead of the database.
  async function setStatus(t: Testimonial, status: TestimonialStatus, message: string) {
    setBusy(t.id);
    try {
      const updated = await patchTestimonial(t.id, { status });
      setItems((all) => all.map((x) => (x.id === t.id ? updated : x)));
      toast.success(message);
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy(editing.id);
    try {
      const updated = await patchTestimonial(editing.id, { contentText: editText });
      setItems((all) => all.map((x) => (x.id === editing.id ? updated : x)));
      toast.success("Testimonial updated");
      setEditing(null);
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(deleting.id);
    try {
      await deleteTestimonial(deleting.id);
      setItems((all) => all.filter((x) => x.id !== deleting.id));
      toast.success("Testimonial deleted");
      setDeleting(null);
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="min-w-0">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Submissions Inbox</h1>
            <p className="mt-1 text-sm text-muted">Review, approve and curate what your customers send.</p>
          </div>
          <LinkButton href="/dashboard/widgets#embed" size="sm">
            Get Embed Code
          </LinkButton>
        </div>

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="text-sm text-muted">Client submission link:</span>
          <code className="min-w-0 flex-1 truncate rounded-xl border border-line bg-surface px-3 py-2 text-sm">{link.replace(/^https?:\/\//, "")}</code>
          <CopyButton text={link} label="Copy" />
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div role="tablist" aria-label="Filter by status" className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                role="tab"
                type="button"
                aria-selected={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm transition",
                  filter === f.id ? "border-brand bg-brand/15 font-medium text-fg" : "border-line text-muted hover:text-fg",
                )}
              >
                {f.label} <span className="ml-0.5 text-xs opacity-70">{counts[f.id]}</span>
              </button>
            ))}
          </div>
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or text"
              aria-label="Search testimonials"
              className="h-10 w-full rounded-xl border border-line bg-surface pl-9 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={<Inbox className="size-5" />}
            title="Your inbox is empty"
            description="When a customer submits a testimonial through your link, it lands here for you to approve."
            action={<CopyButton text={link} label="Copy collection link" />}
          />
        ) : visible.length === 0 ? (
          <EmptyState title="No matches" description="Try a different filter or search term." />
        ) : (
          <ul className="space-y-3">
            {visible.map((t) => (
              <TestimonialCard
                key={t.id}
                t={t}
                busy={busy === t.id}
                onApprove={() => setStatus(t, "approved", "Approved — it's now eligible for your widgets.")}
                onHide={() => setStatus(t, "hidden", "Hidden — it won't appear publicly.")}
                onRestore={() => setStatus(t, "pending", "Restored to pending.")}
                onEdit={() => {
                  setEditing(t);
                  setEditText(t.content_text);
                }}
                onPreview={() => setPreviewing(t)}
                onDelete={() => setDeleting(t)}
              />
            ))}
          </ul>
        )}
      </div>

      <aside className="hidden xl:block" aria-label="Live widget preview">
        <div className="sticky top-24">
          <h2 className="text-lg font-semibold">Live Widget Preview</h2>
          <p className="mb-3 mt-1 text-sm text-muted">What approved testimonials look like on your site.</p>
          <div className="overflow-hidden rounded-2xl border border-line p-3" style={{ background: widgetSettings.theme === "dark" ? "#0b0f24" : "#f4f5fb" }}>
            <WidgetPreview data={previewData} />
          </div>
          <Link href="/dashboard/widgets" className="mt-3 inline-block text-sm text-brand hover:underline">
            Customize widget →
          </Link>
        </div>
      </aside>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit testimonial" description="Fix typos or trim for length. The reviewer's original words are kept.">
        {editing && (
          <>
            <Label htmlFor="edit-text">Text shown publicly</Label>
            <Textarea id="edit-text" rows={7} maxLength={MAX_TESTIMONIAL_CHARS} value={editText} onChange={(e) => setEditText(e.target.value)} />
            {editing.original_content_text && editing.original_content_text !== editText && (
              <button type="button" onClick={() => setEditText(editing.original_content_text!)} className="mt-2 text-xs text-brand hover:underline">
                Restore the reviewer&apos;s original wording
              </button>
            )}
            <p className="mt-2 text-xs text-muted">Please don&apos;t change the meaning — testimonials should stay true to what the reviewer said.</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button onClick={saveEdit} loading={busy === editing.id} disabled={!editText.trim() || editText === editing.content_text}>
                Save changes
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal open={!!previewing} onClose={() => setPreviewing(null)} title="Preview" description="How this testimonial looks with your widget style." className="max-w-xl">
        {previewing && (
          <div className="rounded-xl p-3" style={{ background: widgetSettings.theme === "dark" ? "#0b0f24" : "#f4f5fb" }}>
            <WidgetPreview data={{ settings: { ...widgetSettings, layout: "grid" }, testimonials: [toWidgetTestimonial(previewing)] }} />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete this testimonial?"
        description="This permanently removes it from your account. If you only want it off your site, hide it instead."
        loading={busy === deleting?.id}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

function TestimonialCard({
  t,
  busy,
  onApprove,
  onHide,
  onRestore,
  onEdit,
  onPreview,
  onDelete,
}: {
  t: Testimonial;
  busy: boolean;
  onApprove: () => void;
  onHide: () => void;
  onRestore: () => void;
  onEdit: () => void;
  onPreview: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const power = evaluatePower(t.content_text);
  const long = t.content_text.length > 260;

  return (
    <li>
      <Card className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Avatar name={t.reviewer_name} src={t.reviewer_image_url} className="size-11" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="font-semibold">{t.reviewer_name}</h3>
              <StatusBadge status={t.status} />
            </div>
            <p className="text-sm text-muted">
              {[t.reviewer_title, t.reviewer_company].filter(Boolean).join(" · ") || "No role provided"} · {formatDate(t.created_at)}
            </p>
          </div>
          {t.content_text && (
            <Badge className="hidden border-brand/40 bg-brand/10 text-brand sm:inline-flex" title="Writing-quality guide, not an authenticity check">
              {power.label}
            </Badge>
          )}
        </div>

        {t.video_url && (
          <div className="mt-3 overflow-hidden rounded-xl border border-line bg-black">
            <video controls preload="metadata" src={t.video_url} className="max-h-72 w-full" aria-label={`Video testimonial from ${t.reviewer_name}`}>
              <track kind="captions" />
            </video>
          </div>
        )}

        {t.content_text && (
          <p className={cn("mt-3 whitespace-pre-line text-sm leading-relaxed", !expanded && long && "line-clamp-4")}>{t.content_text}</p>
        )}
        {long && (
          <button type="button" onClick={() => setExpanded((e) => !e)} className="mt-1 text-xs text-brand hover:underline">
            {expanded ? "Show less" : "Read more"}
          </button>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {t.video_url && (
            <Badge className="border-line bg-surface-2 text-muted">
              <Play className="size-3" aria-hidden /> Video
            </Badge>
          )}
          {t.ai_polished && (
            <Badge className="border-brand/40 bg-brand/10 text-brand">
              <Sparkles className="size-3" aria-hidden /> AI-polished draft
            </Badge>
          )}
          {t.rating && (
            <span className="inline-flex items-center gap-0.5 text-amber-400" role="img" aria-label={`${t.rating} out of 5 stars`}>
              {Array.from({ length: t.rating }, (_, i) => (
                <Star key={i} className="size-3.5 fill-current" aria-hidden />
              ))}
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
          {t.status !== "approved" && t.status !== "hidden" && (
            <Button size="sm" onClick={onApprove} loading={busy}>
              <CheckCircle2 className="size-4" /> Approve
            </Button>
          )}
          {t.status === "hidden" && (
            <>
              <Button size="sm" onClick={onApprove} loading={busy}>
                <CheckCircle2 className="size-4" /> Approve
              </Button>
              <Button size="sm" variant="secondary" onClick={onRestore} disabled={busy}>
                <RotateCcw className="size-4" /> Restore
              </Button>
            </>
          )}
          {t.status !== "hidden" && (
            <Button size="sm" variant="secondary" onClick={onHide} disabled={busy}>
              <EyeOff className="size-4" /> Hide
            </Button>
          )}
          <div className="ml-auto flex gap-1">
            <Button size="sm" variant="ghost" onClick={onPreview} aria-label={`Preview ${t.reviewer_name}'s testimonial`}>
              Preview
            </Button>
            <Button size="sm" variant="ghost" onClick={onEdit} disabled={!t.content_text} aria-label={`Edit ${t.reviewer_name}'s testimonial`}>
              <Pencil className="size-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onDelete} disabled={busy} aria-label={`Delete ${t.reviewer_name}'s testimonial`}>
              <Trash2 className="size-4 text-bad" />
            </Button>
          </div>
        </div>
      </Card>
    </li>
  );
}
