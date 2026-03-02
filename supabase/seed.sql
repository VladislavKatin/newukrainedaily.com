insert into sources (name, type, url)
values
  ('UN News', 'rss', 'https://news.un.org/feed/subscribe/en/news/all/rss.xml'),
  ('ReliefWeb Updates', 'rss', 'https://reliefweb.int/updates?advanced-search=%28D48875%29_%28S167%29&search=ukraine&format=rss')
on conflict do nothing;

insert into topics (tag, title, description)
values
  ('humanitarian', 'Humanitarian', 'Aid, logistics, and civilian support coverage.'),
  ('publishing', 'Publishing', 'Editorial systems, SEO, and newsroom process.')
on conflict (tag) do update set
  title = excluded.title,
  description = excluded.description,
  updated_at = timezone('utc', now());
