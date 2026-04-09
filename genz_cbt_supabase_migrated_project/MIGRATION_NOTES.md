# What changed in this migrated project

## Frontend preserved
These pages were kept and rewired instead of rebuilt:
- `index.html`
- `about.html`
- `contact.html`
- `terms.html`
- `privacy.html`
- `cookies.html`
- `admin.html`
- `student.html`
- `result_checker.html`
- `site-common.css`
- `site-common.js`

## New secure runtime path
Old:
- frontend -> Apps Script -> Google Sheets / Drive

New:
- frontend -> `api-client.js` -> Vercel API -> Supabase Auth / Postgres / Storage

## New files
- `api-client.js`
- `api/public-config.js`
- `api/router.js`
- `api/_lib/config.js`
- `api/_lib/supabase.js`
- `api/_lib/helpers.js`
- `supabase/migrations/001_initial_schema.sql`
- `.env.example`
- `DEPLOYMENT_GUIDE.md`

## Legacy files retained intentionally
Old Apps Script backend files were moved to:
- `legacy-appsscript/`

They are kept only as reference and are no longer used by the migrated frontend.

## Important security fix already applied
The old Apps Script backend exposed the correct answer key during exam unlock.
This migrated backend does not send correct answers to the browser during unlock.
Scoring now happens server-side.

## Current auth model
- Supabase Auth is now the source of truth
- usernames are preserved in UI
- a synthetic internal email is derived from username for Supabase Auth login
- service role is used only in server-side Vercel API code
- browser uses only the publishable anon key

## Notes
This migration preserves the existing UI flow as much as possible while moving risky logic server-side.
