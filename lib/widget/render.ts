/**
 * Framework-free widget renderer. Shared by the dashboard live preview (React) and the
 * external embed script, so both always look identical. All user content is inserted via
 * textContent — never as HTML.
 */
import { WIDGET_CSS } from "./styles";
import type { WidgetData, WidgetHandle, WidgetTestimonial } from "./types";

type Children = (Node | string | null | undefined | false)[];

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  attrs?: Record<string, string>,
  children: Children = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (attrs) for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  for (const c of children) if (c) node.append(c);
  return node;
}

const HEX = /^#[0-9a-f]{6}$/i;
const safeUrl = (u: string | null): string | null => (u && /^https?:\/\//i.test(u) ? u : null);
const prefersReducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

function initialsOf(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] ?? "?") + (p.length > 1 ? (p[p.length - 1][0] ?? "") : "")).toUpperCase();
}

function avatar(t: WidgetTestimonial): HTMLElement {
  const fallback = () => el("span", "vc-avatar", { "aria-hidden": "true" }, [initialsOf(t.name)]);
  const src = safeUrl(t.imageUrl);
  if (!src) return fallback();
  const img = el("img", "vc-avatar", { src, alt: "", loading: "lazy", referrerpolicy: "no-referrer" });
  img.addEventListener("error", () => img.replaceWith(fallback()), { once: true });
  return img;
}

function card(t: WidgetTestimonial, d: WidgetData): HTMLElement {
  const s = d.settings;
  const role = [s.showReviewerTitle ? t.title : null, s.showReviewerTitle ? t.company : null].filter(Boolean).join(" · ");
  const stars =
    s.showStars && t.rating
      ? el("div", "vc-stars", { role: "img", "aria-label": `${t.rating} out of 5 stars` }, [
          ...[1, 2, 3, 4, 5].map((i) => el("span", i <= t.rating! ? "" : "vc-off", { "aria-hidden": "true" }, ["★"])),
        ])
      : null;
  const foot = s.showReviewerName
    ? el("figcaption", "vc-foot", undefined, [
        avatar(t),
        el("div", "vc-who", undefined, [
          el("div", "vc-name", undefined, [t.name]),
          role ? el("div", "vc-role", undefined, [role]) : null,
        ]),
      ])
    : null;
  return el("figure", "vc-card", undefined, [
    stars,
    t.text ? el("blockquote", "vc-quote", undefined, [t.text]) : null,
    t.hasVideo ? el("div", "vc-video-tag", undefined, ["Includes a video testimonial"]) : null,
    foot,
  ]);
}

function renderGrid(items: WidgetTestimonial[], d: WidgetData) {
  return el("div", "vc-grid", undefined, items.map((t) => card(t, d)));
}

function renderCarousel(items: WidgetTestimonial[], d: WidgetData, cleanups: (() => void)[]) {
  const track = el("div", "vc-track", { role: "list" }, items.map((t) => el("div", "vc-slide", { role: "listitem" }, [card(t, d)])));
  const prev = el("button", "vc-nav vc-prev", { type: "button", "aria-label": "Previous testimonial" }, ["‹"]);
  const next = el("button", "vc-nav vc-next", { type: "button", "aria-label": "Next testimonial" }, ["›"]);
  const wrap = el("div", "vc-carousel", { role: "region", "aria-roledescription": "carousel", "aria-label": "Customer testimonials", tabindex: "0" }, [prev, track, next]);

  const step = () => (track.firstElementChild as HTMLElement | null)?.getBoundingClientRect().width ?? track.clientWidth;
  const go = (dir: 1 | -1) => track.scrollBy({ left: dir * (step() + 16), behavior: prefersReducedMotion() ? "auto" : "smooth" });
  const sync = () => {
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  };
  prev.addEventListener("click", () => go(-1));
  next.addEventListener("click", () => go(1));
  wrap.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
  });
  track.addEventListener("scroll", sync, { passive: true });
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(sync) : null;
  ro?.observe(track);
  cleanups.push(() => ro?.disconnect());
  requestAnimationFrame(sync);
  return wrap;
}

function renderMarquee(items: WidgetTestimonial[], d: WidgetData) {
  const repeat = Math.max(1, Math.ceil(4 / items.length));
  const makeSet = (clone: boolean) =>
    Array.from({ length: repeat }, (_, r) =>
      items.map((t) => {
        const c = card(t, d);
        if (clone || r > 0) { c.classList.add("vc-clone"); c.setAttribute("aria-hidden", "true"); }
        return c;
      }),
    ).flat();
  // first copy: real content (first repetition only is read by screen readers); second copy: seamless loop
  const track = el("div", "vc-marquee-track", undefined, [...makeSet(false), ...makeSet(true)]);
  track.style.setProperty("--vc-dur", `${Math.max(20, items.length * repeat * 8)}s`);
  const marquee = el("div", "vc-marquee", { role: "region", "aria-label": "Customer testimonials" }, [track]);
  const pause = el("button", "vc-pause", { type: "button", "aria-pressed": "false" }, ["Pause"]);
  pause.addEventListener("click", () => {
    const paused = marquee.classList.toggle("vc-paused");
    pause.textContent = paused ? "Play" : "Pause";
    pause.setAttribute("aria-pressed", String(paused));
  });
  return el("div", undefined, undefined, [marquee, pause]);
}

export function mountWidget(host: HTMLElement, initial: WidgetData): WidgetHandle {
  const root = host.shadowRoot ?? host.attachShadow({ mode: "open" });
  let cleanups: (() => void)[] = [];

  function render(data: WidgetData) {
    cleanups.forEach((c) => c());
    cleanups = [];
    const s = data.settings;
    const wrap = el("div", "vc-root", { "data-theme": s.theme, "data-font": s.fontFamily });
    wrap.style.setProperty("--vc-primary", HEX.test(s.primaryColor) ? s.primaryColor : "#7c5cff");
    wrap.style.setProperty("--vc-radius", `${Math.min(32, Math.max(0, Math.round(s.borderRadius)))}px`);

    const items = data.testimonials.slice(0, Math.max(1, s.maxTestimonials));
    if (data.demo) wrap.append(el("div", "vc-demo", undefined, ["Demo content — not real reviews"]));
    if (items.length === 0) {
      wrap.append(el("div", "vc-empty", undefined, ["No testimonials to show yet."]));
    } else if (s.layout === "carousel") {
      wrap.append(renderCarousel(items, data, cleanups));
    } else if (s.layout === "marquee") {
      wrap.append(renderMarquee(items, data));
    } else {
      wrap.append(renderGrid(items, data));
    }
    root.replaceChildren(el("style", undefined, undefined, [WIDGET_CSS]), wrap);
  }

  render(initial);
  return {
    update: render,
    destroy() {
      cleanups.forEach((c) => c());
      root.replaceChildren();
    },
  };
}

export function renderWidgetError(host: HTMLElement, message: string) {
  const root = host.shadowRoot ?? host.attachShadow({ mode: "open" });
  root.replaceChildren(
    el("style", undefined, undefined, [WIDGET_CSS]),
    el("div", "vc-root", undefined, [el("div", "vc-error", { role: "status" }, [message])]),
  );
}
