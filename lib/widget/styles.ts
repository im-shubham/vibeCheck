/** Scoped to the widget's Shadow DOM, so it can't leak into (or be broken by) the host page. */
export const WIDGET_CSS = `
:host { all: initial; display: block; contain: content; }
*, *::before, *::after { box-sizing: border-box; }
.vc-root {
  --vc-primary: #7c5cff; --vc-radius: 16px;
  --vc-card: #fff; --vc-text: #1b1f3a; --vc-muted: #5d6385; --vc-border: #e3e6f4; --vc-star: #f5a623;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--vc-text); line-height: 1.5; width: 100%; padding: 4px;
  /* Inherited properties flow in from the host element, which the host page can style
     (e.g. a global "* { text-transform: uppercase }"). Reset them so the widget is stable. */
  text-transform: none; letter-spacing: normal; word-spacing: normal; text-indent: 0; text-shadow: none;
  text-align: left; text-decoration: none; font-style: normal; font-weight: 400; font-variant: normal;
  font-size: 16px; direction: ltr; white-space: normal; cursor: auto; visibility: visible; opacity: 1;
}
.vc-root button { text-transform: none; letter-spacing: normal; font-weight: 400; }
.vc-root[data-font="serif"] { font-family: Georgia, "Times New Roman", serif; }
.vc-root[data-font="mono"] { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.vc-root[data-theme="dark"] { --vc-card: #171b36; --vc-text: #eef0fb; --vc-muted: #a2a9cf; --vc-border: #2a3160; }

.vc-demo { display: inline-block; margin: 0 0 10px; padding: 3px 10px; font-size: 12px; border-radius: 999px;
  background: color-mix(in srgb, var(--vc-primary) 16%, transparent); color: var(--vc-primary); border: 1px dashed var(--vc-primary); }
.vc-empty, .vc-error { padding: 20px; text-align: center; color: var(--vc-muted); font-size: 14px;
  border: 1px dashed var(--vc-border); border-radius: var(--vc-radius); }

.vc-card { margin: 0; display: flex; flex-direction: column; gap: 12px; padding: 20px; background: var(--vc-card);
  border: 1px solid var(--vc-border); border-radius: var(--vc-radius);
  box-shadow: 0 1px 2px rgb(0 0 0 / .06), 0 8px 24px -12px color-mix(in srgb, var(--vc-primary) 35%, transparent); }
.vc-stars { display: flex; gap: 2px; color: var(--vc-star); font-size: 16px; line-height: 1; }
.vc-stars .vc-off { color: var(--vc-border); }
.vc-quote { margin: 0; font-size: 15px; overflow-wrap: anywhere; white-space: pre-line; flex: 1; }
.vc-quote::before { content: "\\201C"; color: var(--vc-primary); font-weight: 700; font-size: 1.4em; line-height: 0; vertical-align: -0.3em; margin-right: 2px; }
.vc-foot { display: flex; align-items: center; gap: 10px; min-width: 0; }
.vc-avatar { flex: none; width: 40px; height: 40px; border-radius: 999px; object-fit: cover; display: grid; place-items: center;
  background: var(--vc-primary); color: #fff; font-size: 14px; font-weight: 600; }
.vc-who { min-width: 0; }
.vc-name { font-weight: 600; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vc-role { font-size: 12.5px; color: var(--vc-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vc-video-tag { font-size: 12px; color: var(--vc-primary); }

.vc-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); }

.vc-carousel { position: relative; }
.vc-carousel:focus-visible { outline: 2px solid var(--vc-primary); outline-offset: 4px; border-radius: var(--vc-radius); }
.vc-track { display: flex; gap: 16px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none;
  -webkit-overflow-scrolling: touch; padding: 4px 2px 8px; touch-action: pan-x pan-y; }
.vc-track::-webkit-scrollbar { display: none; }
.vc-slide { flex: 0 0 min(100%, 340px); scroll-snap-align: start; display: flex; }
.vc-slide > .vc-card { width: 100%; }
.vc-nav { position: absolute; top: 50%; transform: translateY(-50%); z-index: 2; width: 36px; height: 36px; border-radius: 999px;
  border: 1px solid var(--vc-border); background: var(--vc-card); color: var(--vc-text); cursor: pointer; font-size: 18px; line-height: 1;
  box-shadow: 0 4px 12px rgb(0 0 0 / .2); }
.vc-nav:disabled { opacity: .35; cursor: default; }
.vc-nav:focus-visible { outline: 2px solid var(--vc-primary); outline-offset: 2px; }
.vc-prev { left: -6px; } .vc-next { right: -6px; }

.vc-marquee { position: relative; overflow: hidden; mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent); }
.vc-marquee-track { display: flex; gap: 16px; width: max-content; animation: vc-scroll var(--vc-dur, 40s) linear infinite; padding: 4px 0; }
.vc-marquee:hover .vc-marquee-track, .vc-marquee:focus-within .vc-marquee-track, .vc-marquee.vc-paused .vc-marquee-track { animation-play-state: paused; }
.vc-marquee .vc-card { width: 300px; flex: none; }
.vc-pause { margin-top: 8px; font: inherit; font-size: 12px; padding: 4px 12px; border-radius: 999px; cursor: pointer;
  border: 1px solid var(--vc-border); background: var(--vc-card); color: var(--vc-text); }
.vc-pause:focus-visible { outline: 2px solid var(--vc-primary); outline-offset: 2px; }
@keyframes vc-scroll { to { transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce) {
  .vc-marquee { overflow-x: auto; mask-image: none; }
  .vc-marquee-track { animation: none; }
  .vc-clone, .vc-pause { display: none; }
}
@media (max-width: 480px) { .vc-card { padding: 16px; } .vc-marquee .vc-card { width: 260px; } }
`;
