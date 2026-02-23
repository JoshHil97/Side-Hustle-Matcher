# Career Command
Premium job application tracking platform built with Next.js App Router, TypeScript, Tailwind, Supabase Auth/Postgres/Storage, and server actions.

## Features
- Email/password auth with Supabase (`/login`, `/signup`)
- Multi-user data isolation through RLS (schema + app-level `user_id` writes)
- Dashboard shell with left sidebar + top quick-action/search bar
- Applications CRM
- Fast table view with search, filters, sorting, bulk status updates, CSV export
- Create application with draft support and validation
- Detail page memory bank with:
- Status pipeline
- Notes tabs (`general`, `interview_prep`, `follow_up`, `company_research`)
- Timeline (status history, notes, documents, reminders)
- Documents upload/download per application
- Contacts linking and quick-add
- Duplicate, archive, delete actions
- Companies directory with research fields (values, interview process, salary notes, tech stack notes)
- Contacts directory CRUD
- Documents library with filters, version labels, and attachment to applications
- Templates vault with tag/type filters, quick copy, and “add template as note” action
- Reminders (in-app) with dashboard surfacing and done/dismiss flows
- Analytics dashboard (weekly volume, funnel, avg days in stage, response rate, source effectiveness, priority distribution)
- Settings page for profile + local preferences
- Automatic activity logging surfaced on dashboard (powered by DB triggers)

## Tech Stack
- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase JS client
- Zod validation
- Next Server Actions for mutations (`src/server/actions`)

## Project Structure
- `src/app` App Router pages
- `src/components` UI/layout/feature components
- `src/lib/supabase` browser/server client setup
- `src/lib/validators` Zod schemas
- `src/server/actions` all DB/storage write actions
- `supabase/migrations/0001_init.sql` full schema + RLS + triggers
- `supabase/seed/seed.sql` sample one-user seed data

## Routes
Auth:
- `/login`
- `/signup`

Dashboard:
- `/dashboard`
- `/dashboard/applications`
- `/dashboard/applications/new`
- `/dashboard/applications/[id]`
- `/dashboard/companies`
- `/dashboard/contacts`
- `/dashboard/documents`
- `/dashboard/templates`
- `/dashboard/analytics`
- `/dashboard/settings`

## Local Development
1. Install dependencies:
```bash
npm install
```

2. Ensure Docker Desktop is running.

3. Start local Supabase:
```bash
supabase start
```

4. Apply migrations + seed:
```bash
supabase db reset --local
```

5. Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-key-from-supabase-status>
```

6. Run the app:
```bash
npm run dev
```

7. Open:
- App: `http://localhost:3000`
- Supabase Studio: `http://127.0.0.1:54323`

## Supabase Migration Instructions
- Migration files:
- `supabase/migrations/0001_init.sql`
- `supabase/migrations/0002_storage_documents_policies.sql`
- To re-run from scratch:
```bash
supabase db reset --local
```
- This migration includes:
- Required extensions (`pgcrypto`, `pg_trgm`)
- All required tables and constraints
- Indexes (including trigram GIN for applications search)
- Updated-at/status/activity/profile triggers + functions
- RLS enablement and action-specific policies per table

## Seed Data
- Seed file: `supabase/seed/seed.sql`
- Configured in `supabase/config.toml` under `[db.seed].sql_paths`
- Seeds only when at least one `auth.users` row exists.
- Create a user first (Auth UI), then run `supabase db reset --local`.

## Storage Setup
The `documents` bucket and storage object policies are created by `0002_storage_documents_policies.sql`.

Recommended object path convention:
- `documents/{user_id}/{application_id}/{timestamp}_{filename}`

The app writes paths as:
- `{user_id}/{application_id}/{timestamp}_{filename}`
inside the `documents` bucket.

## Environment Variables
Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

For Vercel production, set both in Project Settings. You can copy from `.env.example`.

## Scripts
- `npm run dev` start local app
- `npm run lint` lint
- `npm run build` production build check

## Deployment (Vercel)
1. Push repo to GitHub.
2. Import project in Vercel.
3. Add environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.
5. In Supabase production project:
- Run `0001_init.sql`
- Run `0002_storage_documents_policies.sql`
- Ensure Auth email/password enabled

## Reminder Email (Optional Future Integration)
Current implementation is in-app reminders.

If you want email reminders without paid services:
- Add a scheduled trigger (Supabase Edge Function + cron)
- Query due reminders with `status='open'`
- Send via SMTP provider or transactional email service
- Mark/track send metadata in reminder `metadata`/logs

## Notes
- Middleware-based route guard checks for auth token cookie written by the client auth provider.
- Database-level RLS remains the primary enforcement boundary.
