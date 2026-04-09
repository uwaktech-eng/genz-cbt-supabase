# Genz CBT Pro - Supabase + Vercel deployment guide

## 1) Supabase
Create a new Supabase project.

In SQL Editor, run:
- `supabase/migrations/001_initial_schema.sql`

Create your first principal admin from the app later using the `INITIAL_ADMIN_SIGNUP_KEY`.

## 2) Storage
The SQL migration creates these buckets:
- `public-assets` (public)
- `proctoring-private` (private)

## 3) GitHub
Push this migrated project as the codebase you want Vercel to deploy.
Do not commit a real `.env` file.
Commit only `.env.example`.

## 4) Vercel
Import the GitHub repo into Vercel.
Set Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `INITIAL_ADMIN_SIGNUP_KEY`
- optional bucket variables if you change defaults

Redeploy after saving env vars.

## 5) First bootstrap
Open `/admin.html`
Create the first admin with:
- full name
- username
- password
- admin key = `INITIAL_ADMIN_SIGNUP_KEY`

That first admin becomes `principal_admin`.

## 6) Data migration
Export each Google Sheet tab to CSV and import into Supabase in this order:
1. candidates
2. profiles/auth users
3. exams
4. exam_questions
5. permission_codes
6. exam_results
7. exam_progress (optional)

Because auth users must exist in Supabase Auth, student/admin accounts should be recreated or bulk-generated from the dashboard unless you write a one-off import script using the service role.
