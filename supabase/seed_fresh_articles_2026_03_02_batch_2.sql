insert into topics (tag, title, description)
values
  ('health', 'Health', 'Health system pressure, trauma care, and medical access coverage.'),
  ('humanitarian', 'Humanitarian', 'Aid delivery, relief operations, and civilian support coverage.'),
  ('policy', 'Policy', 'Government decisions, legal frameworks, and international support policy.'),
  ('support', 'Support', 'Military, humanitarian, and public support for Ukraine.'),
  ('energy', 'Energy', 'Power resilience, heating, and infrastructure recovery coverage.'),
  ('defense', 'Defense', 'Military aid, procurement, and air defence support.'),
  ('diplomacy', 'Diplomacy', 'Institutional visits, coordination, and international messaging.')
on conflict (tag) do update set
  title = excluded.title,
  description = excluded.description,
  updated_at = timezone('utc', now());

insert into news_items (
  slug,
  title,
  dek,
  summary,
  key_points,
  why_it_matters,
  tags,
  cover_image_url,
  og_image_url,
  source_name,
  source_url,
  status,
  language,
  published_at
)
values
  (
    'ukrainians-in-britain-get-longer-renewal-window-under-ukraine-permission-scheme',
    'Ukrainians in Britain get longer renewal window under Ukraine Permission Scheme',
    'The UK government said on February 25, 2026 that Ukrainians will be able to apply earlier to renew their stay.',
    'A UK government update published on February 25, 2026 said Ukrainians under sanctuary arrangements will be able to apply up to 90 days before their permission expires, instead of 28 days.' || E'\n\n' ||
    'The government said the change is intended to reduce uncertainty for families already in the country and provide greater clarity about their future status.',
    '["The renewal window expands from 28 days to 90 days before expiry.","The policy applies to Ukrainians already in the UK under sanctuary arrangements.","The change is designed to reduce legal uncertainty for families."]'::jsonb,
    'This is not battlefield news, but it is a real support-policy update affecting displaced Ukrainians directly.' || E'\n\n' ||
    'It matters because it concerns legal stability, planning, and the lived reality of sanctuary policy.',
    array['support','policy','humanitarian','ukraine','uk'],
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    'GOV.UK',
    'https://www.gov.uk/government/news/ukrainians-to-receive-greater-certainty-about-their-futures',
    'published',
    'en',
    '2026-02-25T09:00:00Z'
  ),
  (
    'who-and-eu-deliver-surgical-equipment-to-frontline-hospitals-in-ukraine',
    'WHO and EU deliver surgical equipment to frontline hospitals in Ukraine',
    'WHO said on January 13, 2026 that EU-backed medical equipment had been delivered to hospitals in several frontline regions of Ukraine.',
    'A WHO Europe update published on January 13, 2026 said the WHO Country Office in Ukraine, with EU support, delivered surgical and intensive-care equipment to hospitals in Chernihiv, Kherson, Odesa, Mykolaiv, and Sumy regions.' || E'\n\n' ||
    'The release said the equipment included electrosurgical units, anaesthesia stations, and intensive-care beds intended to strengthen emergency and surgical care under wartime pressure.',
    '["WHO said EU-backed equipment was delivered to hospitals in five Ukrainian regions.","The package included electrosurgical units, anaesthesia stations, and intensive-care beds.","The release focused on emergency and surgical capacity near frontline areas."]'::jsonb,
    'This is a concrete humanitarian health story with direct operational detail and clear institutional sourcing.' || E'\n\n' ||
    'It matters because it shows how external support is translating into hospital capacity on the ground.',
    array['health','humanitarian','support','recovery','policy'],
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80',
    'WHO Europe',
    'https://www.who.int/europe/news/item/13-01-2026-who-and-the-eu-deliver-life-saving-surgical-equipment-to-frontline-hospitals-in-ukraine',
    'published',
    'en',
    '2026-01-13T08:30:00Z'
  ),
  (
    'eu-council-backs-90-billion-support-loan-framework-for-ukraine',
    'EU Council backs €90 billion support loan framework for Ukraine',
    'The Council said on February 4, 2026 that it agreed its position on the legal framework for a €90 billion support loan to Ukraine for 2026 and 2027.',
    'A Council press release published on February 4, 2026 said the proposed framework would provide €30 billion in macro-financial support and €60 billion for defense industrial capacity and military procurement.' || E'\n\n' ||
    'The release said the loan is aimed at urgent financing needs and that the Council wants a rapid agreement with the European Parliament so payments can begin in the second quarter of the year.',
    '["The Council agreed its position on a €90 billion support framework for Ukraine.","The package combines macro-financial support with defense-related financing.","The release said the Council wants the legal texts finalized quickly."]'::jsonb,
    'This is a major institutional financing story with direct implications for Ukraine''s budget support and defense capacity.' || E'\n\n' ||
    'It matters because it turns broad political promises into a more concrete legal and financial framework.',
    array['policy','support','defense','diplomacy','recovery'],
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80',
    'Consilium',
    'https://www.consilium.europa.eu/en/press/press-releases/2026/02/04/council-agrees-position-on-legal-framework-to-provide-90-billion-in-financial-support-to-ukraine/',
    'published',
    'en',
    '2026-02-04T12:00:00Z'
  ),
  (
    'uk-says-winter-humanitarian-support-has-helped-more-than-1-million-ukrainians',
    'UK says winter humanitarian support has helped more than 1 million Ukrainians',
    'A UK government release on February 6, 2026 said British-funded winter support had reached more than 1 million vulnerable Ukrainians.',
    'A GOV.UK release published on February 6, 2026 said the UK had supported more than 1 million civilians affected by the winter energy crisis through deliveries such as generators, hygiene kits, and components used to restore heating and water.' || E'\n\n' ||
    'The statement linked the aid directly to severe winter conditions and the impact of attacks on infrastructure as temperatures dropped below minus 20 degrees Celsius in parts of Ukraine.',
    '["The UK said winter humanitarian support reached more than 1 million Ukrainians.","The release mentioned generators, hygiene kits, and restoring water and heating.","The support was framed as a response to energy crisis conditions during severe winter weather."]'::jsonb,
    'This is a useful humanitarian support story because it focuses on practical delivery rather than only political messaging.' || E'\n\n' ||
    'It adds a clear civilian and winter-resilience angle to the site''s coverage.',
    array['humanitarian','support','energy','policy','ukraine'],
    'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
    'GOV.UK',
    'https://www.gov.uk/government/news/uk-provides-vital-humanitarian-support-as-ukraine-suffers-through-brutal-winter',
    'published',
    'en',
    '2026-02-06T10:30:00Z'
  )
on conflict (slug) do update set
  title = excluded.title,
  dek = excluded.dek,
  summary = excluded.summary,
  key_points = excluded.key_points,
  why_it_matters = excluded.why_it_matters,
  tags = excluded.tags,
  cover_image_url = excluded.cover_image_url,
  og_image_url = excluded.og_image_url,
  source_name = excluded.source_name,
  source_url = excluded.source_url,
  status = excluded.status,
  language = excluded.language,
  published_at = excluded.published_at,
  updated_at = timezone('utc', now());
