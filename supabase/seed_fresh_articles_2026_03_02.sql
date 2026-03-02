insert into topics (tag, title, description)
values
  ('health', 'Health', 'Health system pressure, medical access, and humanitarian health coverage.'),
  ('humanitarian', 'Humanitarian', 'Aid delivery, civilian protection, and relief coverage.'),
  ('recovery', 'Recovery', 'Reconstruction planning, funding, and long-term recovery.'),
  ('policy', 'Policy', 'Government, sanctions, international support, and institutional decisions.'),
  ('support', 'Support', 'Military, humanitarian, and public support for Ukraine.'),
  ('energy', 'Energy', 'Energy resilience, grid repairs, and civilian infrastructure support.'),
  ('diplomacy', 'Diplomacy', 'International visits, statements, and coordination around Ukraine.'),
  ('defense', 'Defense', 'Air defence, military aid, procurement, and security support.')
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
    'who-says-attacks-on-ukraine-health-care-rose-20-percent-in-2025',
    'WHO says attacks on Ukraine health care rose 20% in 2025',
    'A WHO release published on February 23, 2026 says verified attacks on health care in Ukraine rose sharply during 2025.',
    'WHO said on February 23, 2026 that Ukraine recorded its highest number of documented attacks on health care in 2025, with facilities, ambulances, warehouses, and staff affected.' || E'\n\n' ||
    'The release also linked civilian energy strikes to worsening health access, arguing that damage to power and heating systems is making care harder to deliver and harder to recover from.',
    '["WHO says documented attacks on health care increased by nearly 20% in 2025.","The release says hospitals, ambulances, warehouses, and health workers were affected.","WHO linked energy infrastructure damage to wider health pressures beyond the hospital system."]'::jsonb,
    'This is a strong institutional update on civilian harm and health-system strain in Ukraine.' || E'\n\n' ||
    'It matters because it ties direct attacks and energy damage to measurable consequences for medical access.',
    array['health','humanitarian','support','energy','policy'],
    'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80',
    'WHO Europe',
    'https://www.who.int/europe/news/item/23-02-2026-attacks-on-ukraine-s-health-care-increased-by-20--in-2025',
    'published',
    'en',
    '2026-02-23T10:00:00Z'
  ),
  (
    'world-bank-update-puts-ukraine-recovery-needs-near-588-billion',
    'World Bank update puts Ukraine recovery needs near $588 billion',
    'A joint assessment released on February 23, 2026 estimates almost $588 billion in reconstruction and recovery needs over the next decade.',
    'The Government of Ukraine, the World Bank Group, the European Commission, and the United Nations released an updated damage and needs assessment on February 23, 2026.' || E'\n\n' ||
    'The update said recovery and reconstruction needs now approach $588 billion over ten years, with major pressure in housing, transport, and energy while urgent repairs and early recovery work continue.',
    '["The updated assessment estimates almost $588 billion in needs over ten years.","Housing, transport, and energy are named as major areas of pressure.","The assessment was released jointly by Ukrainian and international institutions."]'::jsonb,
    'This is one of the clearest institutional benchmarks for reporting on Ukraine''s recovery burden.' || E'\n\n' ||
    'It gives readers a concrete reference point for the scale of reconstruction needs and priority sectors.',
    array['recovery','policy','energy','support','diplomacy'],
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    'World Bank',
    'https://www.worldbank.org/en/news/press-release/2026/02/23/updated-ukraine-recovery-and-reconstruction-needs-assessment-released',
    'published',
    'en',
    '2026-02-23T18:10:00Z'
  ),
  (
    'uk-steps-up-support-with-military-humanitarian-and-reconstruction-package',
    'UK steps up support with military, humanitarian, and reconstruction package',
    'The UK said on February 24, 2026 that it is increasing support for Ukraine across military, humanitarian, and reconstruction lines.',
    'A UK government release published on February 24, 2026 described a new package of military, humanitarian, and reconstruction support timed to the fourth anniversary of Russia''s full-scale invasion.' || E'\n\n' ||
    'The statement framed continued backing for Ukraine as part of broader British and European security, rather than as a one-off announcement.',
    '["The UK announced a package spanning military, humanitarian, and reconstruction support.","The release tied support for Ukraine to wider UK and European security.","The package was presented on the fourth anniversary of the full-scale invasion."]'::jsonb,
    'This is a current government support signal with direct relevance to both policy and aid coverage.' || E'\n\n' ||
    'It helps explain how state support is being positioned as long-term policy rather than a short-lived response.',
    array['support','policy','recovery','humanitarian','defense'],
    'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
    'GOV.UK',
    'https://www.gov.uk/government/news/uk-steps-up-support-for-ukraine-four-years-on-from-putins-full-scale-invasion',
    'published',
    'en',
    '2026-02-24T11:00:00Z'
  ),
  (
    'nato-marks-invasion-anniversary-with-renewed-support-message-for-ukraine',
    'NATO marks invasion anniversary with renewed support message for Ukraine',
    'NATO used the February 24, 2026 anniversary of the full-scale invasion to stress that support for Ukraine remains active and organized.',
    'NATO said on February 24, 2026 that it marked the anniversary of Russia''s war against Ukraine with a ceremony and a NATO-Ukraine Council meeting in Brussels.' || E'\n\n' ||
    'The alliance highlighted continuing military assistance, the NSATU command in Wiesbaden, and the PURL mechanism as part of the current support structure.',
    '["NATO marked the anniversary with a ceremony and a NATO-Ukraine Council meeting.","The alliance said it continues to support Ukraine and highlighted NSATU and PURL.","The message focused on ongoing support structures, not only symbolic commemoration."]'::jsonb,
    'This is a useful institutional marker for understanding how NATO describes ongoing support for Ukraine.' || E'\n\n' ||
    'It signals continuity, coordination, and alliance-level framing around military assistance.',
    array['support','defense','diplomacy','policy','ukraine'],
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
    'NATO',
    'https://www.nato.int/en/news-and-events/articles/news/2026/02/24/nato-commemorates-the-fourth-anniversary-of-russias-full-scale-invasion-of-ukraine',
    'published',
    'en',
    '2026-02-24T09:00:00Z'
  ),
  (
    'president-costa-heads-to-kyiv-as-eu-restates-support-for-ukraine',
    'President Costa heads to Kyiv as EU restates support for Ukraine',
    'The European Council said on February 23, 2026 that President Antonio Costa would travel to Kyiv for the war anniversary and a support-focused leaders'' meeting.',
    'A European Council statement published on February 23, 2026 said President Antonio Costa would travel to Kyiv alongside Commission President Ursula von der Leyen on the fourth anniversary of Russia''s aggression against Ukraine.' || E'\n\n' ||
    'The statement said the visit would include official commemorations, a trilateral meeting with President Zelenskyy, and participation in a Coalition of the Willing meeting focused on durable support and peace.',
    '["President Costa was scheduled to travel to Kyiv on February 24, 2026.","The visit included commemoration, a trilateral meeting, and a Coalition of the Willing meeting.","The statement framed the trip as a reaffirmation of support for Ukraine and European security."]'::jsonb,
    'This is a live diplomatic signal from the EU level, not just a ceremonial visit.' || E'\n\n' ||
    'It matters because it connects anniversary messaging to ongoing political coordination around support and security.',
    array['diplomacy','support','policy','energy','europe'],
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80',
    'Consilium',
    'https://www.consilium.europa.eu/en/press/press-releases/2026/02/23/president-costa-to-travel-to-kyiv-on-the-fourth-anniversary-of-russia-s-aggression-against-ukraine/',
    'published',
    'en',
    '2026-02-23T11:40:00Z'
  ),
  (
    'eu-leaders-visit-kyiv-and-highlight-energy-support-for-ukraine',
    'EU leaders visit Kyiv and highlight energy support for Ukraine',
    'A European Council update on February 24, 2026 linked the Kyiv visit by senior EU leaders to continued energy and civilian infrastructure support.',
    'The European Council said on February 24, 2026 that President Antonio Costa and Commission President Ursula von der Leyen visited Kyiv for meetings, commemorations, and a Coalition of the Willing gathering.' || E'\n\n' ||
    'The update also highlighted energy assistance to Ukraine, including support for grid repairs, restarting power plants, and investment in decentralized renewable energy.',
    '["EU leaders visited Kyiv on February 24, 2026 to mark the war anniversary.","The update highlighted continued EU energy assistance to Ukraine.","The visit was tied to wider support and security messaging."]'::jsonb,
    'This gives the site a fresh EU energy-support angle tied to a current diplomatic event.' || E'\n\n' ||
    'It matters because it links political visibility with practical support for civilian infrastructure.',
    array['energy','diplomacy','support','policy','recovery'],
    'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=80',
    'European Council',
    'https://www.consilium.europa.eu/en/european-council/president/news/2026/02/24/pec-in-kyiv/',
    'published',
    'en',
    '2026-02-24T12:00:00Z'
  ),
  (
    'who-launches-42-million-ukraine-health-appeal-for-2026',
    'WHO launches $42 million Ukraine health appeal for 2026',
    'WHO said on February 6, 2026 that it is seeking $42 million to help protect access to health care in Ukraine.',
    'WHO said on February 6, 2026 that its Ukraine Humanitarian Appeal for 2026 seeks $42 million to protect access to health care for 700,000 people.' || E'\n\n' ||
    'The appeal is focused on trauma care, primary care continuity, preparedness, and medical evacuation as hostilities and attacks on civilian infrastructure continue to drive health needs.',
    '["WHO launched a 2026 appeal seeking $42 million for Ukraine.","The appeal targets access to health care for 700,000 people.","WHO highlighted trauma care, primary care, preparedness, and medical evacuation."]'::jsonb,
    'This is a concrete humanitarian funding signal from a primary health institution.' || E'\n\n' ||
    'It helps explain current medical support priorities in Ukraine in clear operational terms.',
    array['health','humanitarian','support','policy','aid'],
    'https://images.unsplash.com/photo-1580281657527-47f249e8f4df?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1580281657527-47f249e8f4df?auto=format&fit=crop&w=1200&q=80',
    'WHO Europe',
    'https://www.who.int/europe/news/item/06-02-2026-ukraine--who-seeks-us-42-million-in-2026-to-protect-health-care-as-war-enters-its-fifth-year',
    'published',
    'en',
    '2026-02-06T09:00:00Z'
  ),
  (
    'uk-announces-air-defence-package-worth-over-500-million-pounds-for-ukraine',
    'UK announces air-defence package worth over GBP 500 million for Ukraine',
    'The UK government said on February 12, 2026 that it would provide a new air-defence package worth more than half a billion pounds.',
    'A UK government release published on February 12, 2026 said the package includes funding for NATO''s PURL initiative and additional UK-manufactured missiles for Ukraine.' || E'\n\n' ||
    'The announcement linked the package directly to attacks on energy sites, homes, and other civilian infrastructure.',
    '["The UK announced an air-defence package worth over GBP 500 million.","The package includes GBP 150 million for NATO PURL and additional missiles.","The release linked the support to protection of infrastructure and cities."]'::jsonb,
    'This is a concrete defense-support update with operational detail and a clear civilian protection angle.' || E'\n\n' ||
    'It is highly relevant for the site because it ties procurement and air defense to ongoing infrastructure attacks.',
    array['defense','support','energy','policy','uk'],
    'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80',
    'GOV.UK',
    'https://www.gov.uk/government/news/uk-announces-urgent-new-air-defence-package-for-ukraine-worth-over-half-a-billion-pounds',
    'published',
    'en',
    '2026-02-12T15:45:00Z'
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
