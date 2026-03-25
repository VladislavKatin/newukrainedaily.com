create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  source_page text,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_newsletter_subscribers_status_created_at
on newsletter_subscribers (status, created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_newsletter_subscribers_updated_at'
  ) then
    create trigger trg_newsletter_subscribers_updated_at
    before update on newsletter_subscribers
    for each row
    execute function set_updated_at();
  end if;
end
$$;

alter table newsletter_subscribers enable row level security;