create extension if not exists pgcrypto;

create type source_type as enum ('rss', 'web');
create type content_status as enum ('draft', 'published');
create type job_type as enum ('fetch', 'rewrite', 'image', 'publish', 'autopost');
create type job_status as enum ('pending', 'running', 'completed', 'failed', 'cancelled');
create type image_job_status as enum ('pending', 'requested', 'complete', 'failed');

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type source_type not null,
  url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists news_raw (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references sources(id) on delete set null,
  url text not null unique,
  title text not null,
  content_snippet text,
  published_at timestamptz,
  fetched_at timestamptz not null default timezone('utc', now()),
  hash text not null unique
);

create table if not exists news_items (
  id uuid primary key default gen_random_uuid(),
  raw_id uuid references news_raw(id) on delete set null,
  slug text not null unique,
  title text not null,
  dek text,
  summary text,
  key_points jsonb not null default '[]'::jsonb,
  why_it_matters text,
  tags text[] not null default '{}',
  cover_image_url text,
  og_image_url text,
  source_name text,
  source_url text,
  status content_status not null default 'draft',
  language text not null default 'en',
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  body text not null,
  tags text[] not null default '{}',
  cover_image_url text,
  status content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  tag text not null unique,
  title text not null,
  description text,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  type job_type not null,
  payload jsonb not null default '{}'::jsonb,
  status job_status not null default 'pending',
  attempts integer not null default 0,
  last_error text,
  run_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists news_images (
  id uuid primary key default gen_random_uuid(),
  news_item_id uuid not null unique references news_items(id) on delete cascade,
  provider text not null default 'leonardo',
  prompt text not null,
  generation_id text unique,
  status image_job_status not null default 'pending',
  attempts integer not null default 0,
  last_error text,
  remote_image_url text,
  local_path text,
  local_image_url text,
  webhook_payload jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_news_items_published_at on news_items (published_at desc);
create index if not exists idx_news_items_tags on news_items using gin (tags);
create unique index if not exists idx_news_items_raw_id_unique
on news_items (raw_id)
where raw_id is not null;
create index if not exists idx_blog_posts_published_at on blog_posts (published_at desc);
create index if not exists idx_jobs_status_run_at on jobs (status, run_at);
create index if not exists idx_news_images_status_attempts on news_images (status, attempts);

create trigger trg_news_items_updated_at
before update on news_items
for each row
execute function set_updated_at();

create trigger trg_blog_posts_updated_at
before update on blog_posts
for each row
execute function set_updated_at();

create trigger trg_jobs_updated_at
before update on jobs
for each row
execute function set_updated_at();

create trigger trg_news_images_updated_at
before update on news_images
for each row
execute function set_updated_at();

alter table sources enable row level security;
alter table news_raw enable row level security;
alter table news_items enable row level security;
alter table blog_posts enable row level security;
alter table topics enable row level security;
alter table jobs enable row level security;
alter table news_images enable row level security;
