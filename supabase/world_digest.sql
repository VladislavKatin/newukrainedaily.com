create table if not exists world_digest_items (
  id uuid primary key default gen_random_uuid(),
  digest_date date not null,
  position integer not null,
  title text not null,
  summary text not null,
  image_url text,
  image_alt text,
  source_name text not null,
  source_url text not null,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (digest_date, position),
  unique (digest_date, source_url)
);

create index if not exists idx_world_digest_items_digest_date
on world_digest_items (digest_date desc, position asc);

create index if not exists idx_world_digest_items_published_at
on world_digest_items (published_at desc nulls last);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_world_digest_items_updated_at') then
    create trigger trg_world_digest_items_updated_at
    before update on world_digest_items
    for each row
    execute function set_updated_at();
  end if;
end $$;

alter table world_digest_items enable row level security;
