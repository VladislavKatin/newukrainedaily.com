insert into sources (name, type, url)
values
  ('UN News', 'rss', 'https://news.un.org/feed/subscribe/en/news/all/rss.xml'),
  ('ReliefWeb Updates', 'rss', 'https://reliefweb.int/updates?advanced-search=%28D48875%29_%28S167%29&search=ukraine&format=rss'),
  ('GOV.UK Ukraine', 'rss', 'https://www.gov.uk/world/ukraine/news.atom'),
  ('NATO News', 'rss', 'https://www.nato.int/cps/en/natohq/news.htm?keywordquery=ukraine&date_from=2026-01-01&display_mode=rss'),
  ('WHO Europe Ukraine', 'rss', 'https://www.who.int/europe/rss-feeds/news'),
  ('World Bank News', 'rss', 'https://www.worldbank.org/en/news/all?topic_exact=Fragility%2C%20Conflict%20and%20Violence&displayconttype_exact=Press%20Release&qterm=ukraine&lang_exact=English&format=rss'),
  ('Consilium Press Releases', 'rss', 'https://www.consilium.europa.eu/en/press/press-releases/rss/')
on conflict do nothing;

insert into topics (tag, title, description)
values
  ('humanitarian', 'Humanitarian', 'Aid, logistics, and civilian support coverage.'),
  ('publishing', 'Publishing', 'Editorial systems, SEO, and newsroom process.')
on conflict (tag) do update set
  title = excluded.title,
  description = excluded.description,
  updated_at = timezone('utc', now());
