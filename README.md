# New Ukraine Daily

SEO-focused Next.js publishing stack for `www.newukrainedaily.com` with separate `/news` and `/blog` sections. Hosted for free as a static site on Cloudflare Pages; content automation runs in GitHub Actions.

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

## Hosting: Cloudflare Pages (free)

The site is a **static export** (`output: "export"`). There is no Node server in production.

- `npm run build` reads published content from Postgres (Supabase) and writes the whole site to `out/`.
  The build fails on purpose if the database is unreachable, so an empty site is never published.
- `out/` is uploaded to the Cloudflare Pages project `newukrainedaily` (`npm run deploy:cloudflare`).
- `functions/` holds the only server code: Pages Functions for `POST /api/newsletter/subscribe`
  and `POST /api/audience-poll`. They write to Supabase over its REST API.
  Their secrets are set once with `node scripts/setup-secrets.mjs --pages`.
- Images are stored in R2 when `R2_*` variables are set, otherwise in Supabase Storage.

## Automation: GitHub Actions

`.github/workflows/site.yml` runs every hour (and on every push to `main`):

1. `npm run auto -- generate --count=1` on even UTC hours 00–18 (10 articles/day)
2. `npm run auto -- images` and `npm run auto -- publish` (finalize Leonardo images, publish drafts)
3. `npm run auto -- world-digest` (once per Kyiv day) and `npm run auto -- seo-refresh` (daily)
4. `npm run build` → `wrangler pages deploy out` → `npm run check:production-health`
5. Telegram message on failure

GitHub secrets are set once with `node scripts/setup-secrets.mjs --github`
(reads `.env.vercel.prod`, needs `gh auth login`).

Local run of any automation task: `npm run auto -- <task>`.

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

`newukrainedaily.com` DNS is on Cloudflare. Both `www.newukrainedaily.com` (canonical) and the apex
domain are attached as custom domains of the Pages project `newukrainedaily`.

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
