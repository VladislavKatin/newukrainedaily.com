# Scripts

Reserved for local automation scripts such as feed imports, content migration, or batch publishing helpers.

- `verify-stack.mjs`: checks required infrastructure wiring such as Postgres, Leonardo env, and optional Supabase Storage.
- `smoke-cron.mjs`: sequentially calls the protected cron endpoints against a running local or remote app and prints before/after operational status snapshots.
