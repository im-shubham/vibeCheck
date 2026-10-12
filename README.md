# VibeCheck

AI-assisted testimonial collection and social proof for freelancers, agencies, coaches and small teams.
Creators get a public collection page, reviewers submit without an account, creators approve, and approved
testimonials show up on any website through an embeddable widget.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion · Supabase (Postgres, Auth, RLS, Storage) · OpenAI · optional Cloudflare R2 / S3 for video.

## Quick start

```bash
npm install
cp .env.example .env.local     # fill in the values (see below)
npm run dev                    # builds public/embed.js, then starts http://localhost:3000
```

### 1. Supabase
1. Create a project at supabase.com.
2. Apply the schema: paste `supabase/migrations/0001_init.sql` into the SQL editor (or `supabase db push` with the CLI).
   It creates the tables, constraints, RLS policies, column-level grants, plan-limit trigger, AI-usage functions, analytics function and the `avatars` / `reviewer-images` storage buckets.
3. Auth → URL configuration: set **Site URL** to `NEXT_PUBLIC_APP_URL` and add `<APP_URL>/auth/callback` to Redirect URLs.
4. Copy the project URL, anon key and **service-role key** into `.env.local`. The service-role key is server-only.

### 2. OpenAI (optional but recommended)
Set `OPENAI_API_KEY`. `OPENAI_MODEL` defaults to `gpt-4o-mini`. Without a key, everything works except Magic Polish, AI Vibe Chips and the optional "smooth with AI" Mad Libs step. Onboarding falls back to editable starter chips.

### 3. Video (optional)
Set the `S3_*` variables (Cloudflare R2 or AWS S3). Browsers upload straight to the bucket using a 5-minute signed `PUT` URL — video never passes through a Next.js route.
- Make the bucket publicly readable via `S3_PUBLIC_URL` (R2 public bucket / custom domain / CloudFront).
- Add a CORS rule on the bucket allowing `PUT` from your app origin with header `Content-Type`.
- Limits: WebM/MP4, 100 MB, 2 minutes in the recorder.
Without these variables the *Record a Video* tab explains that video isn't set up and text reviews keep working.

## Environment variables

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | Supabase client (RLS-protected) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | public submissions, public widget API, AI-usage RPC |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | **server only** | AI features (`gpt-4o-mini` default) |
| `NEXT_PUBLIC_APP_URL` | both | absolute URLs, embed snippet, auth redirects |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` | server only | optional video storage |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `npm run build` / `npm start` | run / build (also bundles the embed) / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` |
| `npm test` | unit tests (power meter, Mad Libs, AI faithfulness guard, validation, image sniffing, rate limiter, redirect safety) |
| `npm run test:db` | applies the migration to an in-process Postgres (PGlite) with Supabase-style roles and asserts RLS, grants, constraints, plan limits and AI-quota atomicity |
| `npm run build:embed` | bundles `lib/widget/embed-entry.ts` → `public/embed.js` |

## Architecture notes

- **Routes:** `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/onboarding`, `/submit/[slug]`, `/t/[id]`, `/w/[id]` (hosted widget), `/dashboard/{inbox,testimonials,widgets,analytics,settings,billing}`. `proxy.ts` (Next 16's renamed middleware) refreshes sessions and redirects unauthenticated users to `/login?next=…`; the dashboard layout re-checks server-side.
- **Anonymous access never touches tables directly.** RLS grants anon nothing. Public reads/writes go through route handlers using the service-role client with explicit column allow-lists (`lib/public-data.ts`, `app/api/public/*`). The creator is resolved from the slug server-side; creator IDs from the browser are never trusted.
- **Moderation:** submissions are `pending`. A DB constraint prevents approving without `consent_to_publish`. Only `approved` + consented rows are ever returned by the widget API; hidden/pending can't leak.
- **Widget:** one framework-free renderer (`lib/widget/render.ts`) is used by both the dashboard preview and `public/embed.js`, rendered in a Shadow DOM with `textContent` only (no raw HTML). Grid, carousel (buttons, arrow keys, touch scroll-snap) and marquee (pause button, reduced-motion fallback). The public endpoint is CORS-open, cached (`s-maxage=60`), and returns only public fields.
- **AI:** `lib/ai/*` isolates the provider. Retries are bounded exponential backoff for transient errors only; auth/quota/model errors fail fast with safe messages. Rewrites that introduce numbers not in the source are rejected (`assertFaithful`). Usage is reserved atomically in Postgres (`consume_ai_usage`, advisory-locked, counted across features) and refunded if the provider call fails. Reviewers are anonymous, so their AI use is charged to the creator whose page they're on, plus a per-IP burst limit.
- **Rate limiting:** in-memory per instance (`lib/rate-limit.ts`). That's a first line of defence only on serverless — put a shared limiter (Vercel Firewall, Upstash) in front for strict global limits.
- **Duplicate submissions:** each form load carries a `submission_key` (unique); retries return the original row.
- **Analytics:** only submissions and widget *loads* (not unique visitors, no clicks) are recorded, via `analytics_daily()` scoped by RLS.
- **Billing-ready:** plan limits (`lib/plans.ts`, mirrored in SQL) are enforced server-side. No payment provider is connected; paid plans are shown as "Coming soon" and nothing can be purchased.

## Known limitations

- Payments are not integrated (by design — see above).
- Video upload needs your own R2/S3 bucket; it hasn't been exercised against a live bucket in this repo's tests.
- Widget "clicks" aren't tracked, so they aren't shown.
- Reviewer photos: manual upload only (no LinkedIn/Google fetching). Orphaned uploads from abandoned forms aren't garbage-collected yet.
- No generated Supabase types; rows are mapped at call sites (`lib/types.ts`).
- No strict Content-Security-Policy is set (Next inline scripts need nonces); other security headers are configured in `next.config.ts`.
