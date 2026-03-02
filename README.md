# New Ukraine Daily

SEO-focused Next.js publishing stack for `newukrainedaily.com` with separate `/news` and `/blog` sections, protected cron endpoints, Leonardo webhook handling, and Vercel deployment scaffolding.

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

This calls, in order:

- `GET /api/internal/status`
- `POST /api/cron/fetch-news`
- `POST /api/cron/rewrite-news`
- `POST /api/cron/generate-images`
- `POST /api/cron/publish`
- `GET /api/internal/status`

## Vercel deployment

1. Import `https://github.com/asdkaasdka1/newukrainedaily.com` into Vercel under team `asdkaasdka1s-projects`.
2. Add the environment variables from `.env.example` in `Project Settings -> Environment Variables`.
3. Set `PUBLIC_BASE_URL=https://newukrainedaily.com`.
4. Deploy the project.
5. Review scheduled jobs in `Project Settings -> Cron Jobs` and execution logs in the `Functions` / runtime logs view.

## Production environment

Set these variables in Vercel and in your local `.env.local` when testing production integrations:

```bash
PUBLIC_BASE_URL=https://newukrainedaily.com
CRON_SECRET=
DATABASE_URL=
SUPABASE_DATABASE_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=
SUPABASE_STORAGE_PUBLIC_URL=
AI_PROVIDER=
AI_API_KEY=
LEONARDO_API_KEY=
LEONARDO_WEBHOOK_SECRET=
DAILY_PUBLISH_LIMIT=
AUTOPOST_DRY_RUN=
```

## Supabase schema

1. Create a Supabase project and copy the Postgres connection string into `DATABASE_URL`.
   You can also use `SUPABASE_DATABASE_URL`; the app will use it when `DATABASE_URL` is not set.
2. If you want generated Leonardo assets stored in Supabase Storage, also set:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_STORAGE_BUCKET`
   - `SUPABASE_STORAGE_PUBLIC_URL`
3. Open the Supabase dashboard SQL Editor.
4. Run the contents of `supabase/schema.sql`.
5. Optionally run `supabase/seed.sql` to insert starter source/topic rows.
6. Verify the tables in Table Editor: `sources`, `news_raw`, `news_items`, `blog_posts`, `topics`, `jobs`, `news_images`.

Target Supabase project:

- `yrvsqmtvrumkwlxrrqwb`
- `https://supabase.com/dashboard/project/yrvsqmtvrumkwlxrrqwb`

## Domain and DNS

Target production domain:

- `https://newukrainedaily.com`

Recommended deployment flow:

1. Add `newukrainedaily.com` and `www.newukrainedaily.com` to the Vercel project domains.
2. In Cloudflare DNS for `newukrainedaily.com`, create the exact DNS records Vercel shows for the project.
3. Keep `PUBLIC_BASE_URL=https://newukrainedaily.com`.
4. After DNS propagation, confirm:
   - `https://newukrainedaily.com/robots.txt`
   - `https://newukrainedaily.com/sitemap.xml`
   - `https://newukrainedaily.com/feed.xml`
   - `https://newukrainedaily.com/blog/feed.xml`

Current Cloudflare zone:

- `https://dash.cloudflare.com/99a14a83c2911ef1f14e8d11e131cd39/newukrainedaily.com/dns/records`

## Cron endpoints

Protected endpoints:

- `POST /api/cron/fetch-news`
- `POST /api/cron/rewrite-news`
- `POST /api/cron/generate-images`
- `POST /api/cron/publish`
- `POST /api/cron/autopost`
- `GET /api/internal/status`
- `POST /api/internal/run-pipeline`
- `POST /api/webhooks/leonardo`

Each route expects:

```http
Authorization: Bearer <CRON_SECRET>
```

Example local run:

```bash
curl -X POST http://localhost:3000/api/internal/run-pipeline \
  -H "Authorization: Bearer local-cron-secret"
```

Operational status snapshot:

```bash
curl http://localhost:3000/api/internal/status \
  -H "Authorization: Bearer local-cron-secret"
```

## Leonardo images

- `POST /api/cron/generate-images` creates Leonardo generation requests for draft news items without a cover image.
- `POST /api/webhooks/leonardo` is the async callback endpoint that finalizes image storage and updates `news_items`.
- Leonardo is best used with webhook callbacks rather than polling because image generation is asynchronous.
- Leonardo callback delivery is configured on the Leonardo production API key, not per generation request.
- The storage abstraction prefers Supabase Storage when `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, and `SUPABASE_STORAGE_PUBLIC_URL` are configured; otherwise it falls back to `public/generated`.
- Configure the Leonardo webhook/callback URL as:

```text
https://your-domain.example/api/webhooks/leonardo
```

- Configure the callback secret so Leonardo sends:

```http
Authorization: Bearer <LEONARDO_WEBHOOK_SECRET>
```

- Local storage currently writes generated assets to `public/generated`. For production durability, replace this with Supabase Storage or another object store via the storage abstraction.

## First production checklist

1. Apply `supabase/schema.sql`.
2. Apply `supabase/seed.sql`.
3. Fill real production env vars in Vercel.
4. Connect the GitHub repository to Vercel.
5. Add the custom domain in Vercel.
6. Create the DNS records requested by Vercel in Cloudflare.
7. Run `npm run verify:stack`.
8. Run `npm run smoke:cron` against a live app with valid secrets.

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
