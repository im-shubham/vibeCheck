import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluatePower } from "../lib/power-meter";
import { buildMadLibParagraph } from "../lib/madlibs";
import { assertFaithful } from "../lib/ai/guard";
import { AIError } from "../lib/ai/types";
import { slugSchema, submissionSchema, widgetSettingsSchema } from "../lib/validation";
import { sniffImage } from "../lib/storage/images";
import { rateLimit } from "../lib/rate-limit";
import { safeNext } from "../lib/utils";

const KEY = "3f2b8c1e-5a47-4d8e-9a60-1b2c3d4e5f60";

test("power meter: empty text is Getting Started and numbers are optional", () => {
  assert.equal(evaluatePower("").level, "getting-started");
  const rich = evaluatePower(
    "Danielle took our messy website idea and turned it into something we are proud of. Communication was clear throughout, and because of her process the project finished early. It really helped our team feel confident.",
  );
  assert.ok(rich.score >= 55, `expected good detail or better, got ${rich.score}`);
  assert.equal(rich.metricsDetected, false); // no numbers needed to score well
  assert.equal(evaluatePower("Traffic grew 40% in 3 weeks").metricsDetected, true);
});

test("mad libs builds a deterministic paragraph from the answers only", () => {
  const p = buildMadLibParagraph({ need: "a new website.", appreciated: "the clear communication", changed: "things feel clearer" }, "Dan");
  assert.equal(p, "I came to Dan looking for help with a new website. What I appreciated most was the clear communication. After working together, things feel clearer.");
});

test("AI faithfulness guard rejects invented figures and runaway length", () => {
  assert.doesNotThrow(() => assertFaithful("She finished in 2 weeks and I loved it", "She finished in 2 weeks, and I loved it."));
  assert.throws(() => assertFaithful("She was great to work with", "She was great and boosted our revenue by 300%"), AIError);
  assert.throws(() => assertFaithful("Great", "x".repeat(2000)), AIError);
});

test("slug validation", () => {
  assert.equal(slugSchema.parse("Designer-Dan"), "designer-dan");
  for (const bad of ["a", "-dan", "dan-", "da n", "api", "dashboard", "a--b"]) assert.equal(slugSchema.safeParse(bad).success, false, bad);
});

test("submission requires consent and meaningful content", () => {
  const base = { slug: "dan-designs", submissionKey: KEY, reviewerName: "Sam", text: "Really great to work with, thank you!", consent: true };
  assert.equal(submissionSchema.safeParse(base).success, true);
  assert.equal(submissionSchema.safeParse({ ...base, consent: false }).success, false);
  assert.equal(submissionSchema.safeParse({ ...base, text: "short" }).success, false);
  assert.equal(submissionSchema.safeParse({ ...base, text: "", videoUrl: "https://cdn.example.com/videos/a.webm" }).success, true);
  assert.equal(submissionSchema.safeParse({ ...base, text: "x".repeat(3001) }).success, false);
});

test("widget settings validation", () => {
  const ok = { name: "W", layout: "grid", theme: "dark", primaryColor: "#7c5cff", borderRadius: 12, fontFamily: "sans", showStars: true, showReviewerName: true, showReviewerTitle: true, maxTestimonials: 6 };
  assert.equal(widgetSettingsSchema.safeParse(ok).success, true);
  assert.equal(widgetSettingsSchema.safeParse({ ...ok, primaryColor: "red" }).success, false);
  assert.equal(widgetSettingsSchema.safeParse({ ...ok, layout: "<script>" }).success, false);
  assert.equal(widgetSettingsSchema.safeParse({ ...ok, maxTestimonials: 99 }).success, false);
});

test("image sniffing trusts bytes, not filenames", () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.equal(sniffImage(png)?.mime, "image/png");
  assert.equal(sniffImage(new TextEncoder().encode("<svg onload=alert(1)></svg>")), null);
  assert.equal(sniffImage(new TextEncoder().encode("GIF89a......")), null);
});

test("rate limiter blocks after the limit", () => {
  const k = `t-${Math.random()}`;
  assert.equal(rateLimit(k, 2, 1000).ok, true);
  assert.equal(rateLimit(k, 2, 1000).ok, true);
  assert.equal(rateLimit(k, 2, 1000).ok, false);
});

test("safeNext blocks open redirects", () => {
  assert.equal(safeNext("/dashboard/inbox"), "/dashboard/inbox");
  for (const bad of ["https://evil.com", "//evil.com", String.raw`/\evil.com`, null, ""]) assert.equal(safeNext(bad), "/dashboard");
});
