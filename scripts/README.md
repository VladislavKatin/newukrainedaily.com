# Scripts

Reserved for local automation scripts such as feed imports, content migration, or batch publishing helpers.

- `verify-stack.mjs`: checks required infrastructure wiring such as Postgres, Leonardo env, and optional Supabase Storage.
- `smoke-cron.mjs`: sequentially calls the protected cron endpoints against a running local or remote app and prints before/after operational status snapshots.
- `push-main.ps1`: stages all changes, creates a commit from the provided message, and pushes `main` to `origin`.
- `autopush.mjs`: watches the repo, debounces file changes, runs `npm run lint`, then automatically stages, commits, and pushes `main` to `origin` if lint passes.
