# New Ukraine Daily

SEO-focused Next.js publishing stack for `www.newukrainedaily.com` with separate `/news` and `/blog` sections, protected automation endpoints, Leonardo webhook handling, and Vercel deployment scaffolding.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Zod
- ESLint + Prettier

## Local development

```bash
npm i
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

If your local Postgres database is unavailable, the development server can fall back to local preview content when `LOCAL_PREVIEW_CONTENT=true`. Production does not use preview content when the database is empty.

## Build

```bash
npm run build
npm start
```

## Verify infrastructure

```bash
npm run verify:stack
```

This checks:

- `CRON_SECRET`
- Leonardo env presence and webhook URL
- Postgres connectivity
- Supabase Storage reachability when configured

## Smoke test

With the app running locally and `CRON_SECRET` configured:

```bash
npm run smoke:cron
```

## SEO refresh for existing content

To re-apply SEO fields for all already published news/blog entries (canonical, meta, OG, stats, related links):

```bash
npm run seo:refresh
```

## Vercel deployment

1. Import `https://github.com/VladislavKatin/newukrainedaily.com` into Vercel.
2. Add environment variables from `.env.example`.
3. Set `PUBLIC_BASE_URL=https://www.newukrainedaily.com`.
4. Deploy the project.
5. Vercel Cron is intentionally disabled on Hobby. Use GitHub Actions to call `POST /api/cron/generate`.

## Production environment

Set these variables in Vercel and in your local `.env.local` when testing production integrations:

```bash
PUBLIC_BASE_URL=https://www.newukrainedaily.com
GOOGLE_SITE_VERIFICATION=
CRON_SECRET=
DATABASE_URL=
DIRECT_URL=
SUPABASE_DATABASE_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=
AI_PROVIDER=
AI_API_KEY=
OPENAI_API_KEY=
LEONARDO_API_KEY=
LEONARDO_WEBHOOK_SECRET=
DAILY_PUBLISH_LIMIT=
AUTOPOST_DRY_RUN=
FETCH_SOURCES_LIMIT=
FETCH_ITEMS_PER_SOURCE_LIMIT=
REWRITE_BATCH_LIMIT=
REWRITE_REQUEST_SPACING_MS=
IMAGE_BATCH_LIMIT=
IMAGE_MAX_ATTEMPTS=
IMAGE_STALE_MINUTES=
IMAGE_REQUEST_SPACING_MS=
PUBLISH_BATCH_LIMIT=
```

Recommended automation defaults:

```bash
FETCH_SOURCES_LIMIT=20
FETCH_ITEMS_PER_SOURCE_LIMIT=15
REWRITE_BATCH_LIMIT=8
REWRITE_REQUEST_SPACING_MS=1500
IMAGE_BATCH_LIMIT=4
IMAGE_MAX_ATTEMPTS=3
IMAGE_STALE_MINUTES=60
IMAGE_REQUEST_SPACING_MS=2500
PUBLISH_BATCH_LIMIT=5
DAILY_PUBLISH_LIMIT=10
AUTOPOST_DRY_RUN=true
```

## GitHub Actions scheduler

This project does not use Vercel Cron in production on Hobby plans.

- `POST /api/cron/generate` runs one article-generation pipeline per call by default.
- `.github/workflows/generate.yml` calls that endpoint 10 times per day.
- `POST /api/cron/seo-refresh` refreshes SEO fields for already published news/blog.
- `.github/workflows/seo-refresh.yml` calls that endpoint once per day.
- GitHub Actions provides the external scheduler for free.

Add these GitHub repository secrets:

- `CRON_URL`
  - Example: `https://www.newukrainedaily.com/api/cron/generate`
- `CRON_SECRET`
  - Must match the same `CRON_SECRET` configured in Vercel.
- `SEO_REFRESH_URL`
  - Example: `https://www.newukrainedaily.com/api/cron/seo-refresh`

Required Vercel env for this protected endpoint:

- `CRON_SECRET`

## Supabase schema

1. Create a Supabase project and copy the Postgres connection string into `DATABASE_URL`.
2. You can also use `SUPABASE_DATABASE_URL`; the app will use it when `DATABASE_URL` is not set.
3. If you want generated Leonardo assets stored in Supabase Storage, also set:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_STORAGE_BUCKET`
4. Run the contents of `supabase/schema.sql`.
5. Optionally run `supabase/seed.sql`.
6. Run `supabase/harden_rls.sql` if the database already exists and you want to lock down browser-facing Supabase access without recreating the schema.
7. Verify the tables: `sources`, `news_raw`, `news_items`, `blog_posts`, `topics`, `jobs`, `news_images`.

## Domain and DNS

Target production domain:

- `https://www.newukrainedaily.com`

Recommended deployment flow:

1. Add `newukrainedaily.com` and `www.newukrainedaily.com` to the Vercel project domains.
2. In Cloudflare DNS for `newukrainedaily.com`, create the exact DNS records Vercel shows for the project.
3. Keep `PUBLIC_BASE_URL=https://www.newukrainedaily.com`.
4. After DNS propagation, confirm:
   - `https://www.newukrainedaily.com/robots.txt`
   - `https://www.newukrainedaily.com/sitemap.xml`
   - `https://www.newukrainedaily.com/news-sitemap.xml`
   - `https://www.newukrainedaily.com/rss.xml`
   - `https://www.newukrainedaily.com/feed.xml`
   - `https://www.newukrainedaily.com/blog/feed.xml`
   - favicon and app icons are visible in browser tabs and social previews

## Automation endpoints

Protected endpoints:

- `POST /api/cron/generate`
- `POST /api/cron/fetch-news`
- `POST /api/cron/rewrite-news`
- `POST /api/cron/generate-images`
- `POST /api/cron/publish`
- `POST /api/cron/autopost`
- `POST /api/cron/seo-refresh`
- `GET /api/internal/status`
- `POST /api/internal/run-pipeline`
- `POST /api/webhooks/leonardo`

Each route expects:

```http
Authorization: Bearer <CRON_SECRET>
```

Generate one article pipeline run:

```bash
curl -X POST http://localhost:3000/api/cron/generate \
  -H "Authorization: Bearer local-cron-secret" \
  -H "Content-Type: application/json" \
  --data "{\"count\":1}"
```

## Leonardo images

- `POST /api/cron/generate-images` creates Leonardo generation requests for draft news items without a cover image.
- `POST /api/webhooks/leonardo` finalizes image storage and updates `news_items`.
- Configure the callback secret so Leonardo sends:

```http
Authorization: Bearer <LEONARDO_WEBHOOK_SECRET>
```

- For production durability, use Supabase Storage instead of relying on local filesystem writes.
- The app now derives the public asset URL directly from Supabase Storage, so a separate `SUPABASE_STORAGE_PUBLIC_URL` variable is no longer required.

## First production checklist

1. Apply `supabase/schema.sql`.
2. Apply `supabase/seed.sql`.
3. Fill production env vars in Vercel.
4. Connect the GitHub repository to Vercel.
5. Add the custom domain in Vercel.
6. Create the DNS records requested by Vercel in Cloudflare.
7. Run `npm run verify:stack`.

## Project structure

```text
src/
  app/
    (public)/
    api/
  components/
  lib/
supabase/
scripts/
```
