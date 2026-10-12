import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import assert from "node:assert/strict";

// Runs the real migration in Postgres (PGlite/WASM) against Supabase-like roles and checks RLS + constraints.
// Usage: npm run test:db
const migration = fs.readFileSync(new URL("../migrations/0001_init.sql", import.meta.url), "utf8");
const db = new PGlite();

// --- minimal Supabase stand-ins (roles, auth.users/uid, storage) -----------------
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth; create schema storage;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('app.uid', true), '')::uuid $$;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit int, allowed_mime_types text[]);
  create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name, '/') $$;
  grant usage on schema public, auth to anon, authenticated, service_role;
  grant all on all tables in schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  grant execute on all functions in schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
`);

await db.exec(migration);
console.log("migration applied OK");

const A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
await db.exec(`insert into auth.users values ('${A}'), ('${B}')`);

const as = async (role, uid, fn) => {
  await db.exec(`set role ${role}; select set_config('app.uid', '${uid ?? ""}', false)`);
  try {
    return await fn();
  } finally {
    // if the statement aborted the surrounding transaction, the rollback in fails() restores the role
    await db.exec("reset role").catch(() => undefined);
  }
};
const fails = async (label, fn, re) => {
  await db.exec("begin");
  let err = null;
  try {
    await fn();
  } catch (e) {
    err = e;
  }
  await db.exec("rollback");
  assert.ok(err, `${label}: expected an error`);
  if (re) assert.match(String(err.message), re, `${label}: wrong error: ${err.message}`);
  console.log("  ok", label, "->", err.message.slice(0, 70));
};
const ok = (label) => console.log("  ok", label);

// profiles ----------------------------------------------------------------------
const ins = (id, slug) =>
  `insert into profiles (id, display_name, profession_niche, public_slug) values ('${id}','${slug}','Designer','${slug}')`;
await as("authenticated", A, () => db.exec(ins(A, "dan-designs")));
ok("A creates own profile");
await as("authenticated", B, () => db.exec(ins(B, "bea-coach")));
ok("B creates own profile");
await fails("A cannot create a profile for B's id", () => as("authenticated", A, () => db.exec(ins(B, "stolen-slug"))), /row-level security|duplicate/);
await fails("bad slug rejected by constraint", () => as("authenticated", A, () => db.exec(`update profiles set public_slug='Bad Slug!' where id='${A}'`)), /check constraint/);
await fails("user cannot grant themselves a paid plan", () => as("authenticated", A, () => db.exec(`update profiles set plan='pro' where id='${A}'`)), /permission denied/);
await fails("anon cannot read profiles", () => as("anon", null, () => db.query(`select * from profiles`)), /permission denied/);
const seenByB = await as("authenticated", B, () => db.query(`select id from profiles`));
assert.deepEqual(seenByB.rows.map((r) => r.id), [B]);
ok("B only sees B's profile");

// testimonials -------------------------------------------------------------------
await fails("authenticated users cannot INSERT testimonials directly", () => as("authenticated", A, () => db.exec(`insert into testimonials (creator_id, reviewer_name, content_text, consent_to_publish) values ('${A}','x','hello there friend', true)`)), /permission denied/);
await fails("anon cannot INSERT testimonials directly", () => as("anon", null, () => db.exec(`insert into testimonials (creator_id, reviewer_name, content_text) values ('${A}','x','hello there friend')`)), /permission denied/);
const ids = [];
for (let i = 0; i < 3; i++) {
  const r = await db.query(`insert into testimonials (creator_id, reviewer_name, content_text, consent_to_publish, submission_key) values ('${A}','R${i}','text number ${i} here', true, gen_random_uuid()) returning id`);
  ids.push(r.rows[0].id);
}
const noConsent = (await db.query(`insert into testimonials (creator_id, reviewer_name, content_text, consent_to_publish) values ('${A}','NoConsent','text here please', false) returning id`)).rows[0].id;
await db.query(`insert into testimonials (creator_id, reviewer_name, content_text, consent_to_publish) values ('${B}','BsReviewer','text for B only here', true)`);
ok("service role inserts testimonials (server path)");
await fails("duplicate submission_key rejected", () => db.exec(`insert into testimonials (creator_id, reviewer_name, content_text, submission_key) select creator_id,'dup','dup text here ok', submission_key from testimonials where submission_key is not null limit 1`), /duplicate key/);
await fails("cannot approve without reviewer consent (constraint)", () => as("authenticated", A, () => db.exec(`update testimonials set status='approved' where id='${noConsent}'`)), /consent_before_approval/);
await fails("invalid status rejected", () => as("authenticated", A, () => db.exec(`update testimonials set status='public' where id='${ids[0]}'`)), /check constraint/);
await as("authenticated", A, async () => {
  await db.exec(`update testimonials set status='approved', sort_order=1 where id='${ids[0]}'`);
  await db.exec(`update testimonials set status='approved', sort_order=2 where id='${ids[1]}'`);
  await db.exec(`update testimonials set status='hidden' where id='${ids[2]}'`);
});
ok("A approves / hides own testimonials");
const bSees = await as("authenticated", B, () => db.query(`select reviewer_name from testimonials`));
assert.deepEqual(bSees.rows.map((r) => r.reviewer_name), ["BsReviewer"]);
ok("B cannot read A's testimonials");
const bUpd = await as("authenticated", B, () => db.query(`update testimonials set status='hidden' where id='${ids[0]}' returning id`));
assert.equal(bUpd.rows.length, 0);
ok("B's UPDATE of A's testimonial affects 0 rows");
const bDel = await as("authenticated", B, () => db.query(`delete from testimonials where id='${ids[0]}' returning id`));
assert.equal(bDel.rows.length, 0);
ok("B's DELETE of A's testimonial affects 0 rows");
await fails("creator cannot rewrite creator_id", () => as("authenticated", A, () => db.exec(`update testimonials set creator_id='${B}' where id='${ids[0]}'`)), /permission denied/);

// reorder (security invoker -> RLS applies) ----------------------------------------
await as("authenticated", A, () => db.query(`select reorder_testimonials(array['${ids[1]}','${ids[0]}']::uuid[])`));
let order = (await db.query(`select id from testimonials where creator_id='${A}' and status='approved' order by sort_order`)).rows.map((r) => r.id);
assert.deepEqual(order, [ids[1], ids[0]]);
ok("A reorders own approved testimonials");
await as("authenticated", B, () => db.query(`select reorder_testimonials(array['${ids[0]}','${ids[1]}']::uuid[])`));
order = (await db.query(`select id from testimonials where creator_id='${A}' and status='approved' order by sort_order`)).rows.map((r) => r.id);
assert.deepEqual(order, [ids[1], ids[0]]);
ok("B calling reorder on A's ids changes nothing");

// public widget query semantics: only approved + consented --------------------------
const pub = await db.query(`select reviewer_name from testimonials where creator_id='${A}' and status='approved' and consent_to_publish order by sort_order`);
assert.deepEqual(pub.rows.map((r) => r.reviewer_name), ["R1", "R0"]);
ok("public-widget query returns approved only (hidden/pending excluded)");

// widgets ------------------------------------------------------------------------------
await as("authenticated", A, () => db.exec(`insert into widgets (creator_id, name) values ('${A}','W1')`));
ok("free plan: first widget allowed");
await fails("free plan: second widget blocked by trigger", () => as("authenticated", A, () => db.exec(`insert into widgets (creator_id, name) values ('${A}','W2')`)), /widget_limit_reached/);
await fails("cannot create a widget for another creator", () => as("authenticated", B, () => db.exec(`insert into widgets (creator_id, name) values ('${A}','evil')`)), /row-level security|widget_limit_reached/);
assert.equal((await db.query(`select count(*)::int as n from widgets where creator_id='${A}'`)).rows[0].n, 1);
await fails("invalid color rejected", () => as("authenticated", A, () => db.exec(`update widgets set primary_color='javascript:alert(1)' where creator_id='${A}'`)), /check constraint/);
const wid = (await db.query(`select id from widgets where creator_id='${A}'`)).rows[0].id;
assert.equal((await as("authenticated", B, () => db.query(`select id from widgets`))).rows.length, 0);
ok("B cannot see A's widgets");

// ai_usage -------------------------------------------------------------------------------
await fails("authenticated cannot call consume_ai_usage", () => as("authenticated", A, () => db.query(`select * from consume_ai_usage('${A}','polish',5)`)), /permission denied/);
await fails("anon cannot call consume_ai_usage", () => as("anon", null, () => db.query(`select * from consume_ai_usage('${A}','polish',5)`)), /permission denied/);
await fails("authenticated cannot write ai_usage", () => as("authenticated", A, () => db.exec(`insert into ai_usage (creator_id, feature, period_start) values ('${A}','polish', now())`)), /permission denied/);
const feats = ["polish", "mad_libs", "vibe_chips", "polish"];
const used = [];
for (const f of feats) used.push((await as("service_role", null, () => db.query(`select * from consume_ai_usage('${A}', '${f}', 3)`))).rows[0]);
assert.deepEqual(used.map((u) => u.allowed), [true, true, true, false]);
assert.equal(used[3].used, 3);
ok("limit counted across features: 3 allowed, 4th blocked");
await as("service_role", null, () => db.query(`select refund_ai_usage('${A}','polish')`));
assert.equal((await as("service_role", null, () => db.query(`select * from consume_ai_usage('${A}','polish',3)`))).rows[0].allowed, true);
ok("refund frees a slot");
const rows = await as("authenticated", B, () => db.query(`select * from ai_usage`));
assert.equal(rows.rows.length, 0);
ok("B cannot read A's usage");

// widget events / analytics ---------------------------------------------------------------
await fails("authenticated cannot insert widget_events", () => as("authenticated", A, () => db.exec(`insert into widget_events (widget_id, event_type) values ('${wid}','impression')`)), /permission denied/);
await db.query(`insert into widget_events (widget_id, event_type) values ('${wid}','impression'), ('${wid}','impression')`);
const aSeries = (await as("authenticated", A, () => db.query(`select * from analytics_daily(7)`))).rows;
const bSeries = (await as("authenticated", B, () => db.query(`select * from analytics_daily(7)`))).rows;
const sum = (rows, k) => rows.reduce((s, r) => s + Number(r[k]), 0);
assert.equal(aSeries.length, 7);
assert.equal(sum(aSeries, "impressions"), 2);
assert.equal(sum(aSeries, "submissions"), 4);
assert.equal(sum(bSeries, "impressions"), 0);
assert.equal(sum(bSeries, "submissions"), 1);
ok("analytics_daily is scoped to the caller (A: 4 submissions/2 loads, B: 1/0)");

console.log("\nALL SQL/RLS CHECKS PASSED");
