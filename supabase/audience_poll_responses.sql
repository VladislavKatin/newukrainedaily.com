create table if not exists audience_poll_responses (
  id uuid primary key default gen_random_uuid(),
  poll_key text not null,
  answer text not null,
  source_page text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_audience_poll_responses_poll_key_created_at
on audience_poll_responses (poll_key, created_at desc);

alter table audience_poll_responses enable row level security;
