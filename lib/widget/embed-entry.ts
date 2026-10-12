/**
 * VibeCheck embed script. Bundled to public/embed.js (see scripts/build-embed.mjs).
 *
 *   <script src="https://YOUR_DOMAIN/embed.js" data-widget-id="WIDGET_UUID" defer></script>
 *   <div id="vibecheck-widget"></div>
 *
 * Optional: data-target="#some-selector" to choose the mount element.
 */
import { mountWidget, renderWidgetError } from "./render";
import type { WidgetData } from "./types";

(function () {
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const script =
    (document.currentScript as HTMLScriptElement | null) ??
    (Array.from(document.querySelectorAll<HTMLScriptElement>("script[data-widget-id]")).pop() ?? null);
  if (!script) return;

  const widgetId = script.getAttribute("data-widget-id") ?? "";
  if (!UUID.test(widgetId)) {
    console.error("[VibeCheck] Missing or invalid data-widget-id");
    return;
  }

  const origin = new URL(script.src, location.href).origin;
  const targetSel = script.getAttribute("data-target");

  function findHost(): HTMLElement {
    let host: HTMLElement | null = null;
    if (targetSel) {
      try { host = document.querySelector<HTMLElement>(targetSel); } catch { /* invalid selector */ }
    }
    host ??= document.querySelector<HTMLElement>("#vibecheck-widget:not([data-vc-mounted])");
    if (!host) {
      host = document.createElement("div");
      script!.parentNode?.insertBefore(host, script!.nextSibling);
    }
    return host;
  }

  const host = findHost();
  if (host.dataset.vcMounted) return;
  host.dataset.vcMounted = "1";

  // loading skeleton
  renderWidgetError(host, "Loading testimonials…");

  fetch(`${origin}/api/public/widget/${widgetId}`, { mode: "cors", credentials: "omit" })
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json() as Promise<WidgetData>;
    })
    .then((data) => {
      mountWidget(host, data);
      // one impression (a widget load — not a unique visitor) per page view
      try {
        fetch(`${origin}/api/public/widget/${widgetId}/event`, {
          method: "POST",
          mode: "cors",
          credentials: "omit",
          keepalive: true,
          headers: { "Content-Type": "text/plain" },
          body: "impression",
        }).catch(() => undefined);
      } catch { /* ignore */ }
    })
    .catch(() => renderWidgetError(host, "Testimonials are unavailable right now."));
})();
