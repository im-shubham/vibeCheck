-- VibeCheck initial schema
-- Apply with: supabase db push   (or paste into the Supabase SQL editor)

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Plan limits. KEEP IN SYNC with lib/plans.ts.
create or replace function public.plan_widget_limit(p_plan text)
returns int language sql immutable as $$
  select case p_plan when 'free' then 1 when 'creator' then 5 else 25 end
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  business_name text check (business_name is null or char_length(business_name) <= 120),
  brand_name text check (brand_name is null or char_length(brand_name) <= 80),
  profession_niche text not null check (char_length(profession_niche) between 1 and 120),
  website_url text check (website_url is null or (website_url ~* '^https?://' and char_length(website_url) <= 300)),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 500),
  public_slug text not null unique
    check (public_slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  custom_vibe_chips jsonb not null default '[]'::jsonb
    check (jsonb_typeof(custom_vibe_chips) = 'array'),
  plan text not null default 'free' check (plan in ('free', 'creator', 'pro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- testimonials
-- ---------------------------------------------------------------------------
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  reviewer_name text not null check (char_length(reviewer_name) between 1 and 100),
  reviewer_title text check (reviewer_title is null or char_length(reviewer_title) <= 100),
  reviewer_company text check (reviewer_company is null or char_length(reviewer_company) <= 100),
  reviewer_image_url text check (reviewer_image_url is null or char_length(reviewer_image_url) <= 500),
  content_text text not null default '' check (char_length(content_text) <= 3000),
  original_content_text text check (original_content_text is null or char_length(original_content_text) <= 3000),
  ai_polished boolean not null default false,
  rating smallint check (rating is null or rating between 1 and 5),
  video_url text check (video_url is null or char_length(video_url) <= 500),
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  sort_order integer not null default 0,
  metrics_detected boolean not null default false,
  consent_to_publish boolean not null default false,
  submission_key uuid unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- a testimonial needs either text or a video
  constraint testimonials_has_content check (char_length(content_text) > 0 or video_url is not null),
  -- never publish without the reviewer's consent
  constraint testimonials_consent_before_approval check (status <> 'approved' or consent_to_publish)
);
create index testimonials_creator_status_sort_idx on public.testimonials (creator_id, status, sort_order);
create index testimonials_creator_created_idx on public.testimonials (creator_id, created_at desc);
create trigger testimonials_updated_at before update on public.testimonials
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- widgets
-- ---------------------------------------------------------------------------
create table public.widgets (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  layout text not null default 'grid' check (layout in ('grid', 'carousel', 'marquee')),
  theme text not null default 'light' check (theme in ('light', 'dark')),
  primary_color text not null default '#7c5cff' check (primary_color ~* '^#[0-9a-f]{6}$'),
  border_radius integer not null default 16 check (border_radius between 0 and 32),
  font_family text not null default 'sans' check (font_family in ('sans', 'serif', 'mono')),
  show_stars boolean not null default true,
  show_reviewer_name boolean not null default true,
  show_reviewer_title boolean not null default true,
  max_testimonials integer not null default 6 check (max_testimonials between 1 and 24),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index widgets_creator_idx on public.widgets (creator_id);
create trigger widgets_updated_at before update on public.widgets
  for each row execute function public.set_updated_at();

create or replace function public.enforce_widget_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_plan text;
  v_count int;
begin
  select plan into v_plan from public.profiles where id = new.creator_id;
  select count(*) into v_count from public.widgets where creator_id = new.creator_id;
  if v_count >= public.plan_widget_limit(coalesce(v_plan, 'free')) then
    raise exception 'widget_limit_reached' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger widgets_limit before insert on public.widgets
  for each row execute function public.enforce_widget_limit();

-- ---------------------------------------------------------------------------
-- ai_usage: one row per creator / feature / calendar month (UTC)
-- ---------------------------------------------------------------------------
create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  feature text not null check (feature in ('polish', 'vibe_chips', 'mad_libs')),
  request_count integer not null default 0 check (request_count >= 0),
  period_start timestamptz not null,
  created_at timestamptz not null default now(),
  unique (creator_id, feature, period_start)
);
create index ai_usage_creator_period_idx on public.ai_usage (creator_id, period_start);

-- Atomically consume one AI request against the creator's TOTAL monthly limit.
-- An advisory lock serialises concurrent callers so the limit cannot be raced.
create or replace function public.consume_ai_usage(p_creator uuid, p_feature text, p_limit int)
returns table (allowed boolean, used int)
language plpgsql security definer set search_path = public as $$
declare
  v_period timestamptz := date_trunc('month', now() at time zone 'utc') at time zone 'utc';
  v_total int;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_creator::text, 0));
  select coalesce(sum(request_count), 0) into v_total
    from public.ai_usage where creator_id = p_creator and period_start = v_period;
  if v_total >= p_limit then
    return query select false, v_total;
    return;
  end if;
  insert into public.ai_usage (creator_id, feature, period_start, request_count)
    values (p_creator, p_feature, v_period, 1)
    on conflict (creator_id, feature, period_start)
    do update set request_count = public.ai_usage.request_count + 1;
  return query select true, v_total + 1;
end $$;

-- Give back a request when the upstream AI call failed (so failures don't burn quota).
create or replace function public.refund_ai_usage(p_creator uuid, p_feature text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_period timestamptz := date_trunc('month', now() at time zone 'utc') at time zone 'utc';
begin
  perform pg_advisory_xact_lock(hashtextextended(p_creator::text, 0));
  update public.ai_usage set request_count = greatest(request_count - 1, 0)
    where creator_id = p_creator and feature = p_feature and period_start = v_period;
end $$;

revoke all on function public.consume_ai_usage(uuid, text, int) from public, anon, authenticated;
revoke all on function public.refund_ai_usage(uuid, text) from public, anon, authenticated;
grant execute on function public.consume_ai_usage(uuid, text, int) to service_role;
grant execute on function public.refund_ai_usage(uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- widget_events (impressions are recorded server-side only)
-- ---------------------------------------------------------------------------
create table public.widget_events (
  id uuid primary key default gen_random_uuid(),
  widget_id uuid not null references public.widgets(id) on delete cascade,
  event_type text not null check (event_type in ('impression', 'click')),
  created_at timestamptz not null default now()
);
create index widget_events_widget_created_idx on public.widget_events (widget_id, created_at desc);

-- Reorder approved testimonials in one round trip. SECURITY INVOKER: RLS applies,
-- so a creator can only reorder rows they own.
create or replace function public.reorder_testimonials(p_ids uuid[])
returns void language sql security invoker as $$
  update public.testimonials t
     set sort_order = o.ord::int
    from unnest(p_ids) with ordinality as o(id, ord)
   where t.id = o.id
$$;
grant execute on function public.reorder_testimonials(uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security + least-privilege grants
-- Anonymous visitors get NO direct table access. Public reads/writes go through
-- server route handlers that use the service-role key and select only public fields.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.testimonials enable row level security;
alter table public.widgets enable row level security;
alter table public.ai_usage enable row level security;
alter table public.widget_events enable row level security;

revoke all on public.profiles, public.testimonials, public.widgets, public.ai_usage, public.widget_events
  from anon, authenticated;

-- profiles (the `plan` column is deliberately NOT writable by users)
grant select on public.profiles to authenticated;
grant insert (id, display_name, business_name, brand_name, profession_niche, website_url, avatar_url, public_slug, custom_vibe_chips)
  on public.profiles to authenticated;
grant update (display_name, business_name, brand_name, profession_niche, website_url, avatar_url, public_slug, custom_vibe_chips)
  on public.profiles to authenticated;
create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- testimonials: creators read / moderate / delete their own. Inserts happen only via the server.
grant select, delete on public.testimonials to authenticated;
grant update (status, sort_order, content_text, original_content_text) on public.testimonials to authenticated;
create policy testimonials_select_own on public.testimonials for select to authenticated using (creator_id = auth.uid());
create policy testimonials_update_own on public.testimonials for update to authenticated
  using (creator_id = auth.uid()) with check (creator_id = auth.uid());
create policy testimonials_delete_own on public.testimonials for delete to authenticated using (creator_id = auth.uid());

-- widgets
grant select, delete on public.widgets to authenticated;
grant insert (creator_id, name, layout, theme, primary_color, border_radius, font_family, show_stars, show_reviewer_name, show_reviewer_title, max_testimonials)
  on public.widgets to authenticated;
grant update (name, layout, theme, primary_color, border_radius, font_family, show_stars, show_reviewer_name, show_reviewer_title, max_testimonials)
  on public.widgets to authenticated;
create policy widgets_select_own on public.widgets for select to authenticated using (creator_id = auth.uid());
create policy widgets_insert_own on public.widgets for insert to authenticated with check (creator_id = auth.uid());
create policy widgets_update_own on public.widgets for update to authenticated
  using (creator_id = auth.uid()) with check (creator_id = auth.uid());
create policy widgets_delete_own on public.widgets for delete to authenticated using (creator_id = auth.uid());

-- ai_usage: read-only for the owner. Writes only via consume_ai_usage (service role).
grant select on public.ai_usage to authenticated;
create policy ai_usage_select_own on public.ai_usage for select to authenticated using (creator_id = auth.uid());

-- widget_events: owners may read events for their widgets; inserts are server-only.
grant select on public.widget_events to authenticated;
create policy widget_events_select_own on public.widget_events for select to authenticated
  using (exists (select 1 from public.widgets w where w.id = widget_id and w.creator_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- Storage buckets
--   avatars          creator profile photos; each user writes only to /<uid>/...
--   reviewer-images  anonymous reviewer photos; written ONLY by the server after validation
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('reviewer-images', 'reviewer-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy avatars_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_update_own on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- Analytics: per-day submission and widget-load counts for the CALLER only.
-- SECURITY INVOKER, so RLS on testimonials / widget_events scopes every row.
-- ---------------------------------------------------------------------------
create or replace function public.analytics_daily(p_days int)
returns table (day date, submissions bigint, impressions bigint)
language sql stable security invoker as $$
  with bounds as (
    select (now() at time zone 'utc')::date as today, greatest(1, least(p_days, 365)) as n
  ), days as (
    select generate_series(b.today - (b.n - 1), b.today, interval '1 day')::date as d from bounds b
  )
  select d.d,
    (select count(*) from public.testimonials t
       where t.created_at >= d.d::timestamptz and t.created_at < (d.d + 1)::timestamptz),
    (select count(*) from public.widget_events e
       where e.event_type = 'impression' and e.created_at >= d.d::timestamptz and e.created_at < (d.d + 1)::timestamptz)
  from days d order by d.d
$$;
grant execute on function public.analytics_daily(int) to authenticated;
