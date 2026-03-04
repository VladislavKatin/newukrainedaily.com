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

## Local launcher

To start the site locally in a separate PowerShell window and open the browser:

```bash
npm run local:start
```

To stop the local site:

```bash
npm run local:stop
```

Desktop launchers are also created locally:

- `Start New Ukraine Daily.cmd`
- `Stop New Ukraine Daily.cmd`

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

## Quick git push

After GitHub write access is fixed for `origin`, you can commit and push with one command:

```bash
npm run push:main -- "update project"
```

This script:

- stages all changes
- creates a commit with your message
- pushes `main` to `origin`

## Full autopush

If you want the repo to autosync after file changes:

```bash
npm run autopush
```

Behavior:

- watches the working tree
- ignores `.git`, `.next`, `node_modules`, `dist`, `coverage`, `.idea`, and `supabase/.temp`
- waits 4 seconds after the last change
- runs `npm run lint` and aborts if lint fails
- runs `git add -A`
- creates an automatic commit like `autosync: 2026-03-02T12:34:56.000Z`
- pushes `main` to `origin`

Stop it with `Ctrl+C`.

## Vercel deployment

1. Import `https://github.com/asdkaasdka1/newukrainedaily.com` into Vercel under team `asdkaasdka1s-projects`.
2. Add the environment variables from `.env.example` in `Project Settings -> Environment Variables`.
3. Set `PUBLIC_BASE_URL=https://www.newukrainedaily.com`.
4. Deploy the project.
5. Vercel Cron is intentionally disabled on Hobby. Use GitHub Actions to call `POST /api/cron/generate` instead.

## Production environment

Set these variables in Vercel and in your local `.env.local` when testing production integrations:

```bash
PUBLIC_BASE_URL=https://www.newukrainedaily.com
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

Recommended automation defaults for staying inside service limits:

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

Instead:

- `POST /api/cron/generate` runs one article-generation pipeline per call by default.
- `.github/workflows/generate.yml` calls that endpoint 10 times per day.
- GitHub Actions provides the external scheduler for free.

Add these GitHub repository secrets:

- `CRON_URL`
  - Example: `https://www.newukrainedaily.com/api/cron/generate`
- `CRON_SECRET`
  - Must match the same `CRON_SECRET` configured in Vercel.

Required Vercel env for this protected endpoint:

- `CRON_SECRET`

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
6. Run `supabase/harden_rls.sql` if the database already exists and you want to lock down browser-facing Supabase access without recreating the schema.
7. Verify the tables in Table Editor: `sources`, `news_raw`, `news_items`, `blog_posts`, `topics`, `jobs`, `news_images`.

## Supabase security

- The app reads and writes through the server using `DATABASE_URL`, not through a browser Supabase client.
- For that reason, public browser roles do not need direct table access.
- `supabase/schema.sql` now enables Row Level Security on all core tables.
- If your database was created before this change, run `supabase/harden_rls.sql` in Supabase SQL Editor.
- With RLS enabled and no public policies added, `anon` and `authenticated` browser roles should no longer see unrestricted table access.

Target Supabase project:

- `yrvsqmtvrumkwlxrrqwb`
- `https://supabase.com/dashboard/project/yrvsqmtvrumkwlxrrqwb`

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
   - `https://www.newukrainedaily.com/feed.xml`
   - `https://www.newukrainedaily.com/blog/feed.xml`

Current Cloudflare zone:

- `https://dash.cloudflare.com/99a14a83c2911ef1f14e8d11e131cd39/newukrainedaily.com/dns/records`

## Cron endpoints

Protected endpoints:

- `POST /api/cron/generate`
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

Generate one article pipeline run:

```bash
curl -X POST http://localhost:3000/api/cron/generate \
  -H "Authorization: Bearer local-cron-secret" \
  -H "Content-Type: application/json" \
  --data "{\"count\":1}"
```

## Leonardo images

- `POST /api/cron/generate-images` creates Leonardo generation requests for draft news items without a cover image.
- `POST /api/webhooks/leonardo` is the async callback endpoint that finalizes image storage and updates `news_items`.
- Leonardo is best used with webhook callbacks rather than polling because image generation is asynchronous.
- Leonardo callback delivery is configured on the Leonardo production API key, not per generation request.
- The storage abstraction prefers Supabase Storage when `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, and `SUPABASE_STORAGE_PUBLIC_URL` are configured. For production durability, configure this path instead of relying on local filesystem writes.
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
