insert into sources (name, type, url)
select seed.name, seed.type::source_type, seed.url
from (
  values
    ('UN News', 'rss', 'https://news.un.org/feed/subscribe/en/news/all/rss.xml'),
    ('ReliefWeb Updates', 'rss', 'https://reliefweb.int/updates?advanced-search=%28D48875%29_%28S167%29&search=ukraine&format=rss'),
    ('GOV.UK Ukraine', 'rss', 'https://www.gov.uk/world/ukraine/news.atom'),
    ('NATO News', 'rss', 'https://www.nato.int/cps/en/natohq/news.htm?keywordquery=ukraine&date_from=2026-01-01&display_mode=rss'),
    ('World Bank News', 'rss', 'https://www.worldbank.org/en/news/all?topic_exact=Fragility%2C%20Conflict%20and%20Violence&displayconttype_exact=Press%20Release&qterm=ukraine&lang_exact=English&format=rss'),
    ('President of Ukraine News', 'rss', 'https://www.president.gov.ua/en/rss/news/all.rss'),
    ('President Office Updates', 'rss', 'https://www.president.gov.ua/en/rss/news/administration.rss'),
    ('President Speeches', 'rss', 'https://www.president.gov.ua/en/rss/news/speeches.rss')
) as seed(name, type, url)
where not exists (
  select 1
  from sources s
  where regexp_replace(lower(s.url), '\s+', '', 'g') = regexp_replace(lower(seed.url), '\s+', '', 'g')
);

insert into topics (tag, title, description)
values
  ('humanitarian', 'Humanitarian', 'Aid, logistics, and civilian support coverage.'),
  ('publishing', 'Publishing', 'Editorial systems, SEO, and newsroom process.')
on conflict (tag) do update set
  title = excluded.title,
  description = excluded.description,
  updated_at = timezone('utc', now());
