alter type job_type add value if not exists 'daily_generate';
alter type job_type add value if not exists 'select_candidates';
alter type job_type add value if not exists 'link';

alter table if exists public.news_raw
  add column if not exists canonical_url text;

alter table if exists public.news_items
  add column if not exists content text,
  add column if not exists topics text[] not null default '{}',
  add column if not exists entities text[] not null default '{}',
  add column if not exists og_image_alt text,
  add column if not exists canonical_url text,
  add column if not exists meta_title text,
  add column if not exists meta_description text,
  add column if not exists reading_time_minutes integer,
  add column if not exists word_count integer,
  add column if not exists char_count integer,
  add column if not exists internal_links jsonb not null default '[]'::jsonb,
  add column if not exists related_ids uuid[] not null default '{}',
  add column if not exists fingerprint text,
  add column if not exists is_duplicate boolean not null default false,
  add column if not exists quality_score numeric(5,2),
  add column if not exists primary_topic text,
  add column if not exists location text,
  add column if not exists scheduled_at timestamptz,
  add column if not exists indexable boolean not null default true;

alter table if exists public.blog_posts
  add column if not exists og_image_url text,
  add column if not exists og_image_alt text,
  add column if not exists canonical_url text,
  add column if not exists meta_title text,
  add column if not exists meta_description text,
  add column if not exists reading_time_minutes integer,
  add column if not exists word_count integer,
  add column if not exists char_count integer,
  add column if not exists primary_topic text,
  add column if not exists indexable boolean not null default true;

create index if not exists idx_news_raw_canonical_url on public.news_raw (canonical_url);
create index if not exists idx_news_raw_fetched_at on public.news_raw (fetched_at desc);
create index if not exists idx_news_items_status_published_at on public.news_items (status, published_at desc);
create index if not exists idx_news_items_topics on public.news_items using gin (topics);
create index if not exists idx_news_items_entities on public.news_items using gin (entities);
create unique index if not exists idx_news_items_fingerprint_unique
on public.news_items (fingerprint)
where fingerprint is not null;
