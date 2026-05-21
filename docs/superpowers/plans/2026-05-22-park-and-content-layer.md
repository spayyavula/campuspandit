# Park Consumer App + Content Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move CampusPandit into the 3-month observe window — park the legacy consumer app, migrate Azure Postgres to a new Supabase project, ship four content sections + Pilot Application form + Plausible analytics. Drop infrastructure cost from ~$60–115/mo to ~$5–25/mo.

**Architecture:** Azure Static Web App serves `/`, `/for-students`, and six new public routes. Legacy `/auth` and protected routes redirect to `/`. The FastAPI Container App scales to 0 replicas; Azure Postgres is deleted after a Blob-stored `pg_dump` snapshot is verified. A new Supabase project holds the restored Azure data plus four observe-window tables (`feature_requests`, `engagement_signals`, `pilot_applications`, `feature_request_votes`). The existing question-bank Supabase (`ecnrvbyzbfhrorxwxkms`) is untouched.

**Tech Stack:** Vite + React 18 + TypeScript, react-router-dom v6, `@supabase/supabase-js`, `react-markdown` (existing dep), Tailwind CSS, `lucide-react`, Azure CLI, Plausible Analytics, PostgreSQL `pg_dump`/`pg_restore`.

**Spec:** `docs/superpowers/specs/2026-05-22-park-consumer-app-supabase-migration-design.md`

**Domain glossary:** `CONTEXT.md`

**Stage 2 (conditional, week 4+):** separate plan at `docs/superpowers/plans/2026-05-22-stage-2-magic-link.md` — execute only if `docs/superpowers/queries/stage-gates.md` triggers it.

---

## Phase 0 — Pre-flight

### Task 0.1: Verify B2B landings have zero Container App dependency

**Files:**
- Read: `src/components/LandingPage.tsx`, `src/components/LandingPageStudent.tsx`

- [ ] **Step 1: Grep for any import that reaches the backend client**

```bash
grep -rE "(from ['\"].*services/api|from ['\"].*utils/messagingAPI|from ['\"].*hooks/useSSE|from ['\"].*utils/coursesAPI|from ['\"].*utils/crmAPI|delightfulpond-e2c9744c)" src/components/LandingPage.tsx src/components/LandingPageStudent.tsx
```
Expected: zero matches.

- [ ] **Step 2: If any matches surface, stop and fix in Task 2.1/2.2 before proceeding**

Document the offending imports in a comment in this task — they must be removed before parking the backend, or the landing breaks.

- [ ] **Step 3: Commit (no file changes — this is a verification gate)**

No commit needed if zero matches. If you found and fixed any imports, that gets committed as part of Phase 2 tasks.

---

### Task 0.2: Inventory Azure Postgres

**Files:** none (read-only Azure operations)

- [ ] **Step 1: Connect to Azure Postgres via psql or Supabase Studio's external-DB feature**

Use the existing connection string from the Container App's `DATABASE_URL` env var:
```bash
az containerapp show --name campuspandit-backend-prod --resource-group campuspandit-rg-prod \
  --query "properties.template.containers[0].env[?name=='DATABASE_URL'].value" -o tsv
```

- [ ] **Step 2: Capture data size, table list, extension list**

```sql
-- Size
SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size;

-- Tables with row counts
SELECT schemaname, relname, n_live_tup
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Extensions
SELECT extname, extversion FROM pg_extension ORDER BY extname;
```

- [ ] **Step 3: Decision branch on Supabase tier**

If `db_size > 400 MB`, provision Supabase **Pro** ($25/mo) instead of Free in Task 0.3. Otherwise Free tier is fine.

- [ ] **Step 4: Save inventory to a local notes file (not committed)**

```bash
echo "DB size: <value>" > /tmp/azure-pg-inventory.txt
echo "Tables: <list>" >> /tmp/azure-pg-inventory.txt
echo "Extensions: <list>" >> /tmp/azure-pg-inventory.txt
```

This is for your reference during Phase 1 restore — not committed.

---

### Task 0.3: Provision new Supabase project

**Files:** `.env.local` (gitignored — for local dev only)

- [ ] **Step 1: Create project at https://supabase.com/dashboard**

Project name: `campuspandit-observe`. Region: match Azure (probably `ap-south-1` or closest). Plan: Free (or Pro if Task 0.2 step 3 said so).

- [ ] **Step 2: Record credentials in a secrets vault (not committed)**

From `Project Settings → API`:
- `SUPABASE_URL` — `https://<project-ref>.supabase.co`
- `anon` public key
- `service_role` secret key — **never** in client code or git

Store in your password manager. Also paste the public values into `.env.local` for local dev:
```
VITE_SUPABASE_OBSERVE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_OBSERVE_ANON_KEY=<anon-public-key>
```

- [ ] **Step 3: Verify connectivity**

```bash
curl -i "https://<project-ref>.supabase.co/rest/v1/?apikey=<anon-key>"
```
Expected: HTTP 200 with a Swagger-style description payload.

- [ ] **Step 4: Add the same env vars to Azure Static Web Apps configuration**

```bash
az staticwebapp appsettings set \
  --name <swa-name> --resource-group campuspandit-rg-prod \
  --setting-names \
    VITE_SUPABASE_OBSERVE_URL=https://<project-ref>.supabase.co \
    VITE_SUPABASE_OBSERVE_ANON_KEY=<anon-public-key>
```

- [ ] **Step 5: No commit (env vars only, all in secrets vault / SWA config)**

---

### Task 0.4: Provision Azure Blob backup container

**Files:** none (Azure operations)

- [ ] **Step 1: Create container if it doesn't exist**

```bash
az storage account list --resource-group campuspandit-rg-prod --query "[].name" -o tsv
# Pick or create the storage account
az storage container create --name db-backups --account-name <storage-account>
```

- [ ] **Step 2: Set 365-day lifecycle policy (Hot → Cool at 30d → Archive at 90d → Delete at 365d)**

```bash
az storage account management-policy create --account-name <storage-account> \
  --resource-group campuspandit-rg-prod \
  --policy '{"rules":[{"enabled":true,"name":"db-backup-lifecycle","type":"Lifecycle","definition":{"filters":{"blobTypes":["blockBlob"],"prefixMatch":["db-backups/"]},"actions":{"baseBlob":{"tierToCool":{"daysAfterModificationGreaterThan":30},"tierToArchive":{"daysAfterModificationGreaterThan":90},"delete":{"daysAfterModificationGreaterThan":365}}}}}]}'
```

- [ ] **Step 3: No commit (Azure infra only)**

---

## Phase 1 — Backup, Migrate Data, Admin Schemas

### Task 1.1: pg_dump from Azure Postgres

**Files:** `campuspandit-2026-05-22.dump` (local temp file, not committed)

- [ ] **Step 1: Run pg_dump in custom format with no-owner / no-acl flags**

```bash
pg_dump -Fc --no-owner --no-acl \
  "postgresql://dbadmin:PASSWORD@campuspandit-db.postgres.database.azure.com:5432/campuspandit?sslmode=require" \
  -f campuspandit-2026-05-22.dump
```

Replace `PASSWORD` with the value from Task 0.2's `DATABASE_URL` query.

- [ ] **Step 2: Verify dump file is non-trivial**

```bash
ls -lh campuspandit-2026-05-22.dump
# Expected: tens of MB to hundreds of MB depending on data
pg_restore --list campuspandit-2026-05-22.dump | head -20
# Expected: list of tables, indexes, sequences
```

- [ ] **Step 3: No commit (dump file is local temp, not git-tracked)**

---

### Task 1.2: Upload dump to Azure Blob

**Files:** none

- [ ] **Step 1: Upload with checksum verification**

```bash
az storage blob upload \
  --container-name db-backups \
  --account-name <storage-account> \
  --name campuspandit-2026-05-22.dump \
  --file campuspandit-2026-05-22.dump \
  --overwrite false
```

- [ ] **Step 2: Verify upload integrity**

```bash
LOCAL_SIZE=$(stat -c%s campuspandit-2026-05-22.dump 2>/dev/null || stat -f%z campuspandit-2026-05-22.dump)
REMOTE_SIZE=$(az storage blob show --container-name db-backups --account-name <storage-account> --name campuspandit-2026-05-22.dump --query 'properties.contentLength' -o tsv)
echo "Local: $LOCAL_SIZE  Remote: $REMOTE_SIZE"
```
Expected: identical numbers.

- [ ] **Step 3: No commit**

---

### Task 1.3: Schema restore to Supabase

**Files:** none

- [ ] **Step 1: Restore schema only**

```bash
pg_restore --schema-only --no-owner --no-acl \
  -d "postgresql://postgres:PASSWORD@db.<project-ref>.supabase.co:5432/postgres" \
  campuspandit-2026-05-22.dump
```
Replace `PASSWORD` with the Supabase database password from Task 0.3.

- [ ] **Step 2: Inspect errors**

Errors restoring objects in reserved schemas (`auth.*`, `storage.*`, `realtime.*`) are expected — Supabase manages those. Errors restoring `extension` lines are usually fine — `uuid-ossp` and `pgcrypto` are pre-installed.

If a real schema error appears (e.g., column type missing, FK to non-existent table), fix it manually via Supabase Studio SQL Editor.

- [ ] **Step 3: Verify table list on Supabase matches Azure**

```sql
-- Run in Supabase Studio SQL Editor
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
```
Cross-check against the Task 0.2 inventory.

- [ ] **Step 4: No commit**

---

### Task 1.4: Data restore to Supabase

**Files:** none

- [ ] **Step 1: Restore data with triggers disabled**

```bash
pg_restore --data-only --no-owner --no-acl --disable-triggers \
  -d "postgresql://postgres:PASSWORD@db.<project-ref>.supabase.co:5432/postgres" \
  campuspandit-2026-05-22.dump
```

`--disable-triggers` is critical — otherwise the existing LISTEN/NOTIFY triggers fire on every row insert and either error or flood.

- [ ] **Step 2: Watch for errors**

Foreign-key violations during data restore usually mean the order is off. `pg_restore` handles this by default but if you see them, re-run with `--data-only --table=<failing-table>` for the problematic table after dependencies are loaded.

- [ ] **Step 3: No commit**

---

### Task 1.5: Verify migration (row counts + spot checks)

**Files:** none

- [ ] **Step 1: Row count comparison**

Run on Azure (still alive):
```sql
SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY relname;
```
Run on Supabase:
```sql
SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY relname;
```
Diff the two lists. Counts should match within a few rows (any difference > 1% is suspect).

- [ ] **Step 2: Spot-check three rows**

Pick one user, one course, and one channel_message. Confirm each round-trips identically (especially JSON columns and timestamps with timezone).
```sql
SELECT * FROM users LIMIT 1;
SELECT * FROM courses LIMIT 1;
SELECT * FROM channel_messages LIMIT 1;
```

- [ ] **Step 3: No commit**

---

### Task 1.6: Create `feature_requests` table on the new Supabase project

**Files:** none (DDL run in Supabase Studio)

- [ ] **Step 1: Open Supabase Studio → SQL Editor on the new project**

- [ ] **Step 2: Run the DDL**

```sql
CREATE TABLE feature_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  description text CHECK (char_length(description) <= 2000),
  audience text NOT NULL CHECK (audience IN ('coaching_center', 'prospective_cc_via_student', 'both')),
  submitter_email text,
  upvotes int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY ideas_insert_any ON feature_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY ideas_select_published ON feature_requests
  FOR SELECT TO anon, authenticated USING (is_published = true);
```

- [ ] **Step 3: Verify**

```sql
INSERT INTO feature_requests (title, audience) VALUES ('Test idea', 'both');
SELECT * FROM feature_requests;
-- The row should NOT be visible via anon — is_published is false. Flip it manually to test SELECT:
UPDATE feature_requests SET is_published = true WHERE title = 'Test idea';
SELECT * FROM feature_requests;
-- Should now be visible. Then delete the test row:
DELETE FROM feature_requests WHERE title = 'Test idea';
```

- [ ] **Step 4: No commit (DDL lives in the spec, not in repo)**

---

### Task 1.7: Create `engagement_signals` table

**Files:** none

- [ ] **Step 1: Run DDL in Supabase Studio**

```sql
CREATE TABLE engagement_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('linkedin', 'twitter', 'other')),
  post_url text NOT NULL,
  post_topic text,
  posted_at timestamptz NOT NULL,
  impressions int,
  likes int,
  comments int,
  shares int,
  link_clicks int,
  profile_visits int,
  notes text,
  captured_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE engagement_signals ENABLE ROW LEVEL SECURITY;
-- No anonymous policies — admin-only.
```

- [ ] **Step 2: Verify by attempting an anon INSERT (should fail)**

In a separate tab using `curl` with the anon key:
```bash
curl -X POST "https://<project-ref>.supabase.co/rest/v1/engagement_signals" \
  -H "apikey: <anon-key>" -H "Content-Type: application/json" \
  -d '{"platform":"linkedin","post_url":"x","posted_at":"now()"}'
```
Expected: HTTP 401 or 403. (If it succeeds, RLS is misconfigured.)

- [ ] **Step 3: No commit**

---

### Task 1.8: Create `pilot_applications` table

**Files:** none

- [ ] **Step 1: Run DDL in Supabase Studio**

```sql
CREATE TABLE pilot_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  center_name text NOT NULL CHECK (char_length(center_name) BETWEEN 2 AND 200),
  owner_name text NOT NULL CHECK (char_length(owner_name) BETWEEN 2 AND 200),
  location text NOT NULL CHECK (char_length(location) BETWEEN 2 AND 200),
  students_count int NOT NULL CHECK (students_count BETWEEN 1 AND 100000),
  subjects_taught text[] NOT NULL CHECK (array_length(subjects_taught, 1) BETWEEN 1 AND 20),
  current_software text,
  website_or_instagram text,
  contact_email text NOT NULL CHECK (contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  contact_phone text,
  message text CHECK (char_length(coalesce(message, '')) <= 4000),
  icp_fit_score int CHECK (icp_fit_score BETWEEN 0 AND 10),
  icp_fit_notes text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewed','accepted','rejected','withdrawn')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pilot_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY apps_insert_any ON pilot_applications
  FOR INSERT TO anon, authenticated WITH CHECK (true);
-- No public SELECT — applications are sensitive.
```

- [ ] **Step 2: Verify INSERT works but SELECT does not for anon**

```bash
# INSERT (anon)
curl -X POST "https://<project-ref>.supabase.co/rest/v1/pilot_applications" \
  -H "apikey: <anon-key>" -H "Content-Type: application/json" \
  -d '{"center_name":"Test","owner_name":"Test","location":"Test","students_count":50,"subjects_taught":["Physics"],"contact_email":"t@example.com"}'
# Expected: HTTP 201

# SELECT (anon)
curl "https://<project-ref>.supabase.co/rest/v1/pilot_applications?apikey=<anon-key>"
# Expected: HTTP 200 with empty array (RLS hides rows from anon)
```

- [ ] **Step 3: Delete the test row via Supabase Studio**

```sql
DELETE FROM pilot_applications WHERE center_name = 'Test';
```

- [ ] **Step 4: No commit**

---

### Task 1.9: Create `feature_request_votes` table

**Files:** none

- [ ] **Step 1: Run DDL in Supabase Studio**

```sql
CREATE TABLE feature_request_votes (
  feature_request_id uuid NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (feature_request_id, user_id)
);

ALTER TABLE feature_request_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY votes_insert_self ON feature_request_votes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY votes_delete_self ON feature_request_votes FOR DELETE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY votes_select_any ON feature_request_votes FOR SELECT TO anon, authenticated USING (true);
```

- [ ] **Step 2: Verify schema exists**

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'feature_request_votes' ORDER BY ordinal_position;
```

- [ ] **Step 3: No commit (table exists but won't be used until Phase 3.5 wires the upvote button)**

---

## Phase 2 — Park Consumer App + Strip Auth Surface

### Task 2.1: Strip "Log in" + reroute Apply CTAs in `LandingPage.tsx`

**Files:**
- Modify: `src/components/LandingPage.tsx`

- [ ] **Step 1: Open file in editor**

- [ ] **Step 2: Remove "Log in" link from desktop nav**

Find around line 47:
```tsx
<a href="/auth" className="px-4 py-2 text-sm text-primary-500 hover:text-primary-600 transition-colors">
  Log in
</a>
```
Delete this anchor (and the surrounding wrapper `div`'s gap-3 will close up — leave the div, just delete the Log in `<a>`).

- [ ] **Step 3: Remove "Log in" link from mobile menu**

Find around line 75:
```tsx
<a href="/auth" className="block w-full px-4 py-2 text-sm text-primary-500 border border-primary-500 rounded-lg hover:bg-primary-50 transition-colors text-center">
  Log in
</a>
```
Delete.

- [ ] **Step 4: Change every "Apply for pilot" CTA from `#apply` anchor to `/apply` route**

Find all `href="#apply"` occurrences (there are 3–4 across hero, pricing card, and apply section). Replace each with `href="/apply"`.

- [ ] **Step 5: Remove the legacy `mailto:` link inside the `<section id="apply">` block**

Find around line 679:
```tsx
<a href="mailto:founders@campuspandit.com?subject=..." className="...">
  Apply via email
  <ArrowRight ... />
</a>
```
Replace with:
```tsx
<a href="/apply" className="inline-flex px-8 py-4 bg-white text-primary-600 rounded-lg hover:bg-primary-50 transition-colors items-center justify-center gap-2 font-medium text-lg">
  Open application form
  <ArrowRight className="w-5 h-5" />
</a>
```

- [ ] **Step 6: Update any remaining `@campuspandit.com` references to `@campuspandit.ai`**

```bash
grep -n "campuspandit\.com" src/components/LandingPage.tsx
```
Replace each with `campuspandit.ai`.

- [ ] **Step 7: Build to verify no syntax errors**

```bash
npm run build
```
Expected: build succeeds, no TS errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/LandingPage.tsx
git commit -m "feat(landing): strip Log in + route Apply CTAs to /apply form

- Remove Log in link from desktop and mobile nav (observe-mode parks auth)
- Change every Apply for pilot CTA from #apply anchor to /apply route
- Replace mailto: in #apply section with form route
- Update remaining founders@campuspandit.com to .ai"
```

---

### Task 2.2: Replace `/auth` CTAs in `LandingPageStudent.tsx` with meta-lead-gen mailto

**Files:**
- Modify: `src/components/LandingPageStudent.tsx`

- [ ] **Step 1: Open file in editor**

- [ ] **Step 2: Replace every `href="/auth"` with the new mailto**

Use Edit's replace_all on the exact substring:
- Find: `href="/auth"`
- Replace: `href="mailto:founders@campuspandit.ai?subject=Tell%20us%20about%20your%20coaching%20center&body=I%20study%20at%20a%20coaching%20center%20that%20might%20benefit%20from%20CampusPandit.%0A%0ACoaching%20center%20name%3A%0ALocation%3A%0AWebsite%2FInstagram%3A%0A"`

Should hit all 9 occurrences.

- [ ] **Step 3: Update the CTA copy**

Find CTA button labels like "Start learning free", "Sign up", "Get started free", "Apply for the pilot" within `<LandingPageStudent>`. Replace each with **"Tell your coaching center about CampusPandit"**. Some buttons may have multi-word labels — keep the surrounding markup, just swap the visible text.

- [ ] **Step 4: Verify no `/auth` references remain**

```bash
grep -n '/auth' src/components/LandingPageStudent.tsx
```
Expected: zero matches.

- [ ] **Step 5: Verify no `@campuspandit.com` references remain**

```bash
grep -n 'campuspandit\.com' src/components/LandingPageStudent.tsx
```
Expected: zero matches.

- [ ] **Step 6: Build to verify**

```bash
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/components/LandingPageStudent.tsx
git commit -m "feat(landing-students): reframe as meta lead-gen, replace /auth CTAs

- All /auth CTAs become mailto: with 'Tell us about your coaching center' framing
- CTA copy updated from direct-to-student signup language to CC outreach prompts
- Canonical contact domain @campuspandit.ai"
```

---

### Task 2.3: Park legacy protected routes in `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Open file**

- [ ] **Step 2: Add `ParkedRoute` helper just inside the `AppRoutes` component**

Place near the top of `AppRoutes`, before the return statement:
```tsx
const ParkedRoute: React.FC = () => <Navigate to="/" replace />;
```

- [ ] **Step 3: Replace the `/auth` route element with `<ParkedRoute />`**

Find:
```tsx
<Route path="/auth" element={!user ? <Auth onAuthStateChange={login} /> : <Navigate to="/coach" />} />
```
Replace with:
```tsx
<Route path="/auth" element={<ParkedRoute />} />
```

- [ ] **Step 4: Replace every protected route's component with `<ParkedRoute />`**

For each protected route currently wrapped like:
```tsx
<Route path="/coach" element={user ? <AICoach studentId={user.id} /> : <Navigate to="/auth" />} />
```
Replace the entire `element` value with `<ParkedRoute />`:
```tsx
<Route path="/coach" element={<ParkedRoute />} />
```

Apply this transformation to **every** protected route (`/weak-areas`, `/tutors`, `/tutor/...`, `/messages`, `/preferences`, `/notebooklm`, `/google-learn`, `/openstax`, `/flashcards`, `/admin/...`, `/crm/...`, `/payment/history`, `/courses/...`, `/instructor/...`, `/library/...`). The `/payment/success` and `/payment/failure` routes can stay as-is — they have no `user` guard and don't depend on the backend for rendering.

Use replace_all if the pattern `user ? <` is uniform; otherwise edit each route line.

- [ ] **Step 5: Build to verify**

```bash
npm run build
```
Expected: build succeeds. Some warnings about unused imports (`AICoach`, `WeakAreaManager`, etc.) are OK — leave them; tree-shaking removes unused code.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat(routes): park /auth and all legacy protected routes

ParkedRoute helper redirects to / via React Router. Legacy lazy
imports stay (tree-shaking removes unused code at build). The
public routes (/, /for-students, /payment/success, /payment/failure)
are unchanged."
```

---

### Task 2.4: Defensive short-circuit in `useSSE.ts`

**Files:**
- Modify: `src/hooks/useSSE.ts`

- [ ] **Step 1: Open file, find the `connect` function (around line 79)**

- [ ] **Step 2: Add an early return at the top of `connect`**

```ts
const connect = useCallback(() => {
  // Defense-in-depth: if the consumer app is parked, never open an EventSource.
  // The route-level ParkedRoute should already prevent this hook from mounting,
  // but in case a future change re-mounts MessagingApp by accident, short-circuit.
  if (import.meta.env.VITE_CONSUMER_APP_PARKED === 'true') {
    setIsConnected(false);
    return;
  }

  // Prevent concurrent connection attempts
  if (isConnectingRef.current || eventSource.current?.readyState === EventSource.OPEN) {
    console.log('SSE: Already connected or connecting, skipping...');
    return;
  }
  // ... rest of function unchanged
```

- [ ] **Step 3: Set the env var in Azure SWA config**

```bash
az staticwebapp appsettings set --name <swa-name> --resource-group campuspandit-rg-prod \
  --setting-names VITE_CONSUMER_APP_PARKED=true
```

- [ ] **Step 4: Build to verify TS still compiles**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useSSE.ts
git commit -m "feat(sse): defensive short-circuit when consumer app is parked

VITE_CONSUMER_APP_PARKED=true short-circuits EventSource creation so
even if MessagingApp accidentally renders, no traffic hits the dead
Container App endpoint."
```

---

### Task 2.5: Deploy and smoke-test Phase 2

**Files:** none

- [ ] **Step 1: Push to main, let Azure Static Web Apps workflow deploy**

```bash
git push origin main
```

- [ ] **Step 2: Wait for the workflow to complete (~3–5 min)**

```bash
gh run watch
# or refresh the Azure SWA "Deployments" tab
```

- [ ] **Step 3: Incognito smoke test against www.campuspandit.ai**

Open each in a fresh incognito window and verify:
- `/` — renders fully, no "Log in" anywhere, Apply CTAs link to `/apply` (which will 404 until Phase 3h — that's expected for now)
- `/for-students` — renders fully, every CTA opens a `mailto:` draft to `founders@campuspandit.ai` with the new subject
- `/auth` — immediately redirects to `/`
- `/coach` — immediately redirects to `/`
- `/messages` — immediately redirects to `/`
- `/crm` — immediately redirects to `/`

- [ ] **Step 4: Open browser DevTools → Network tab and confirm no requests to `campuspandit-backend.delightfulpond...azurecontainerapps.io`**

Refresh `/` and `/for-students`. No backend requests should appear.

- [ ] **Step 5: No commit (smoke test only)**

---

## Phase 3 — Content Sections, Pilot Application, Plausible

### Task 3.0.1: Add new public routes to `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add lazy imports for the new components at the top of `App.tsx`**

Place alongside the existing `lazy(() => ...)` imports:
```tsx
const Blog = lazy(() => import('./components/Blog'));
const BlogPost = lazy(() => import('./components/BlogPost'));
const PreparationMaterials = lazy(() => import('./components/PreparationMaterials'));
const Roadmap = lazy(() => import('./components/Roadmap'));
const Ideas = lazy(() => import('./components/Ideas'));
const PilotApplication = lazy(() => import('./components/PilotApplication'));
const PilotApplicationThanks = lazy(() => import('./components/PilotApplicationThanks'));
```

- [ ] **Step 2: Add `<Route>` entries inside `<Routes>`, before the fallback `*` route**

```tsx
<Route path="/blog" element={<Blog />} />
<Route path="/blog/:slug" element={<BlogPost />} />
<Route path="/materials" element={<PreparationMaterials />} />
<Route path="/roadmap" element={<Roadmap />} />
<Route path="/ideas" element={<Ideas />} />
<Route path="/apply" element={<PilotApplication />} />
<Route path="/apply/thanks" element={<PilotApplicationThanks />} />
```

- [ ] **Step 3: Build will fail until each component file exists — that's expected. Don't commit yet; Task 3.0.1 is incomplete until the next 7 tasks create those files.**

This is a structural exception to the one-task-one-commit pattern: routes + components ship together. Carry the dirty `App.tsx` change forward until Task 3.7.2 (PilotApplicationThanks) completes, then commit as part of that task.

---

### Task 3.1.1: Create blog content directory and two seed markdown files

**Files:**
- Create: `src/content/blog/2026-05-22-running-a-coaching-center-like-a-saas.md`
- Create: `src/content/blog/2026-05-22-jee-prep-the-honest-version.md`

- [ ] **Step 1: Create directory**

```bash
mkdir -p src/content/blog
```

- [ ] **Step 2: Create B2B placeholder post**

`src/content/blog/2026-05-22-running-a-coaching-center-like-a-saas.md`:
```markdown
---
title: "Running a coaching center like a SaaS"
slug: "running-a-coaching-center-like-a-saas"
date: "2026-05-22"
audience: "coaching_center"
excerpt: "The case for treating your coaching center like a software product, from someone building the platform."
seo_description: "How small and mid-sized JEE/NEET coaching centers can compete with PhysicsWallah and Allen by treating their operations like a SaaS."
---

> Placeholder content. Real post being written by Sreekanth.
>
> Intended themes: why founders of 50–1,000-student centers should think product-first; the four leaks that erode renewals; what changes when an AI Coach is on every student; honest math on retention vs acquisition.

(Replace this body with the real post before launch.)
```

- [ ] **Step 3: Create student placeholder post**

`src/content/blog/2026-05-22-jee-prep-the-honest-version.md`:
```markdown
---
title: "JEE prep — the honest version"
slug: "jee-prep-the-honest-version"
date: "2026-05-22"
audience: "prospective_cc_via_student"
excerpt: "What actually matters in JEE prep, cutting through coaching-chain marketing."
seo_description: "Practical, evidence-based JEE preparation advice from CampusPandit — the platform behind your coaching center's app."
---

> Placeholder content. Real post being written by Sreekanth.
>
> Intended themes: what coaching brochures don't tell you; the PYQ-weighted study heuristic; when to switch chapters; how to talk to your coaching center about gaps.

(Replace this body with the real post before launch.)
```

- [ ] **Step 4: Verify build still passes (markdown files don't break Vite)**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/content/blog/
git commit -m "feat(blog): add two placeholder seed posts with frontmatter

Real content authored by Sreekanth before launch. Frontmatter
schema: title, slug, date, audience, excerpt, seo_description."
```

---

### Task 3.1.2: Create `src/data/blog-index.ts` for post discovery

**Files:**
- Create: `src/data/blog-index.ts`

- [ ] **Step 1: Create the file**

```ts
import runningSaaS from '../content/blog/2026-05-22-running-a-coaching-center-like-a-saas.md?raw';
import jeePrep from '../content/blog/2026-05-22-jee-prep-the-honest-version.md?raw';

export type BlogAudience = 'coaching_center' | 'prospective_cc_via_student' | 'both';

export interface BlogPost {
  title: string;
  slug: string;
  date: string;
  audience: BlogAudience;
  excerpt: string;
  seoDescription: string;
  body: string;
}

interface RawBlogPost {
  raw: string;
  slug: string;
}

const RAW_POSTS: RawBlogPost[] = [
  { raw: runningSaaS, slug: 'running-a-coaching-center-like-a-saas' },
  { raw: jeePrep, slug: 'jee-prep-the-honest-version' },
];

function parseFrontmatter(raw: string): BlogPost {
  const fmMatch = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!fmMatch) throw new Error('blog post missing frontmatter');
  const [, fm, body] = fmMatch;

  const get = (key: string): string => {
    const m = fm.match(new RegExp(`^${key}:\\s*"?([^"\\n]+)"?\\s*$`, 'm'));
    if (!m) throw new Error(`blog post missing frontmatter key: ${key}`);
    return m[1].trim();
  };

  return {
    title: get('title'),
    slug: get('slug'),
    date: get('date'),
    audience: get('audience') as BlogAudience,
    excerpt: get('excerpt'),
    seoDescription: get('seo_description'),
    body: body.trim(),
  };
}

export const posts: BlogPost[] = RAW_POSTS
  .map(({ raw }) => parseFrontmatter(raw))
  .sort((a, b) => b.date.localeCompare(a.date));

export const postBySlug = (slug: string): BlogPost | undefined =>
  posts.find(p => p.slug === slug);
```

- [ ] **Step 2: Verify Vite accepts the `?raw` import**

Vite supports `?raw` natively (no plugin needed). If you get a TS error about the `?raw` import:
- Add to `src/vite-env.d.ts`:
  ```ts
  declare module '*.md?raw' {
    const content: string;
    export default content;
  }
  ```

- [ ] **Step 3: Build**

```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/data/blog-index.ts src/vite-env.d.ts
git commit -m "feat(blog): index module for post discovery and frontmatter parsing

Imports markdown files raw via Vite ?raw, parses frontmatter with a
small regex (no extra dep), exposes posts sorted by date and a
postBySlug lookup."
```

---

### Task 3.1.3: Create `src/components/Blog.tsx` listing page

**Files:**
- Create: `src/components/Blog.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { posts, type BlogAudience } from '../data/blog-index';

const Blog: React.FC = () => {
  const [filter, setFilter] = useState<BlogAudience | 'all'>('all');
  const visible = filter === 'all' ? posts : posts.filter(p => p.audience === filter || p.audience === 'both');

  return (
    <div className="min-h-screen bg-white">
      <head>
        <title>Blog · CampusPandit</title>
        <meta name="description" content="Writing on running coaching centers, JEE/NEET prep, and the tech behind CampusPandit." />
      </head>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <h1 className="text-4xl font-bold text-neutral-900 mb-6">Blog</h1>

        <div className="flex gap-2 mb-10">
          <FilterChip label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
          <FilterChip label="Coaching centers" active={filter === 'coaching_center'} onClick={() => setFilter('coaching_center')} />
          <FilterChip label="Students" active={filter === 'prospective_cc_via_student'} onClick={() => setFilter('prospective_cc_via_student')} />
        </div>

        <ul className="space-y-8">
          {visible.map(p => (
            <li key={p.slug} className="border-b border-neutral-200 pb-8">
              <Link to={`/blog/${p.slug}`} className="block hover:opacity-80 transition">
                <p className="text-sm text-neutral-500 mb-2">{p.date}</p>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-2">{p.title}</h2>
                <p className="text-neutral-600">{p.excerpt}</p>
              </Link>
            </li>
          ))}
          {visible.length === 0 && (
            <li className="text-neutral-500">No posts in this category yet.</li>
          )}
        </ul>
      </main>
    </div>
  );
};

interface FilterChipProps { label: string; active: boolean; onClick: () => void; }
const FilterChip: React.FC<FilterChipProps> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm transition ${
      active ? 'bg-primary-500 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
    }`}
  >
    {label}
  </button>
);

export default Blog;
```

- [ ] **Step 2: Build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Blog.tsx
git commit -m "feat(blog): listing page at /blog with audience filter chips"
```

---

### Task 3.1.4: Create `src/components/BlogPost.tsx` detail page

**Files:**
- Create: `src/components/BlogPost.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { postBySlug } from '../data/blog-index';

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/blog" replace />;
  const post = postBySlug(slug);
  if (!post) return <Navigate to="/blog" replace />;

  return (
    <div className="min-h-screen bg-white">
      <head>
        <title>{post.title} · CampusPandit</title>
        <meta name="description" content={post.seoDescription} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.seoDescription} />
        <link rel="canonical" href={`https://www.campuspandit.ai/blog/${post.slug}`} />
      </head>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <Link to="/blog" className="text-sm text-primary-500 hover:underline mb-6 inline-block">
          ← All posts
        </Link>
        <article>
          <p className="text-sm text-neutral-500 mb-3">{post.date}</p>
          <h1 className="text-4xl font-bold text-neutral-900 mb-8">{post.title}</h1>
          <div className="prose prose-neutral max-w-none">
            <ReactMarkdown>{post.body}</ReactMarkdown>
          </div>
        </article>
      </main>
    </div>
  );
};

export default BlogPost;
```

- [ ] **Step 2: Confirm Tailwind has the `prose` class**

If `@tailwindcss/typography` is not installed, install it:
```bash
npm install -D @tailwindcss/typography
```
Then add to `tailwind.config.js`:
```js
plugins: [require('@tailwindcss/typography')],
```

- [ ] **Step 3: Build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/BlogPost.tsx tailwind.config.js package.json package-lock.json
git commit -m "feat(blog): post detail page with react-markdown + tailwind typography"
```

---

### Task 3.1.5: Update prerender script for blog routes

**Files:**
- Modify: `scripts/prerender.js`

- [ ] **Step 1: Open file, locate the route list**

The existing prerender script renders a fixed set of routes. Find the array of routes (variable usually named `routes` or `pages`).

- [ ] **Step 2: Add the new routes to the array**

```js
const routes = [
  '/',
  '/for-students',
  '/blog',
  '/blog/running-a-coaching-center-like-a-saas',
  '/blog/jee-prep-the-honest-version',
  '/materials',
  '/roadmap',
  '/ideas',
  '/apply',
  '/apply/thanks',
];
```

For the dynamic `/blog/:slug` routes, enumerate the slugs from the actual posts:
```js
import { posts } from '../src/data/blog-index.ts';
const blogSlugRoutes = posts.map(p => `/blog/${p.slug}`);
const routes = [
  '/', '/for-students', '/blog', '/materials', '/roadmap', '/ideas', '/apply', '/apply/thanks',
  ...blogSlugRoutes,
];
```
(If the prerender script is in CommonJS, adapt the import accordingly — the existing script structure dictates the syntax.)

- [ ] **Step 3: Run prerender locally**

```bash
npm run build:seo
```
Expected: each route produces a static HTML file in `dist/`.

- [ ] **Step 4: Spot-check one of the generated files**

```bash
ls dist/blog/
cat dist/blog/running-a-coaching-center-like-a-saas/index.html | head -30
```
Expected: HTML contains the post title and meta tags.

- [ ] **Step 5: Commit**

```bash
git add scripts/prerender.js
git commit -m "build(seo): prerender blog routes + new public pages

Adds /blog, /blog/:slug (per actual posts), /materials, /roadmap,
/ideas, /apply, /apply/thanks to the puppeteer prerender list."
```

---

### Task 3.2.1: Create `src/data/materials.ts`

**Files:**
- Create: `src/data/materials.ts`

- [ ] **Step 1: Create the data module with seed entries**

```ts
export type MaterialSubject = 'Physics' | 'Chemistry' | 'Math' | 'Biology' | 'Mixed';
export type MaterialType = 'pdf' | 'external';

export interface Material {
  title: string;
  description: string;
  url: string;
  type: MaterialType;
  subject: MaterialSubject;
}

export const materials: Material[] = [
  // Physics
  { title: 'NCERT Physics Class 11', description: 'Official NCERT textbook chapters (free).', url: 'https://ncert.nic.in/textbook.php?keph1=0-15', type: 'external', subject: 'Physics' },
  { title: 'NCERT Physics Class 12', description: 'Official NCERT textbook chapters (free).', url: 'https://ncert.nic.in/textbook.php?leph1=0-15', type: 'external', subject: 'Physics' },
  { title: 'OpenStax College Physics', description: 'Free Rice-University-published physics textbook covering JEE topics.', url: 'https://openstax.org/details/books/college-physics-ap-courses-2e', type: 'external', subject: 'Physics' },

  // Chemistry
  { title: 'NCERT Chemistry Class 11', description: 'Official NCERT textbook chapters (free).', url: 'https://ncert.nic.in/textbook.php?kech1=0-14', type: 'external', subject: 'Chemistry' },
  { title: 'NCERT Chemistry Class 12', description: 'Official NCERT textbook chapters (free).', url: 'https://ncert.nic.in/textbook.php?lech1=0-16', type: 'external', subject: 'Chemistry' },
  { title: 'OpenStax Chemistry 2e', description: 'Free Rice-University-published chemistry textbook.', url: 'https://openstax.org/details/books/chemistry-2e', type: 'external', subject: 'Chemistry' },

  // Math
  { title: 'NCERT Mathematics Class 11', description: 'Official NCERT textbook chapters (free).', url: 'https://ncert.nic.in/textbook.php?kemh1=0-16', type: 'external', subject: 'Math' },
  { title: 'NCERT Mathematics Class 12 Part 1', description: 'Official NCERT textbook chapters (free).', url: 'https://ncert.nic.in/textbook.php?lemh1=0-13', type: 'external', subject: 'Math' },
  { title: 'NCERT Mathematics Class 12 Part 2', description: 'Official NCERT textbook chapters (free).', url: 'https://ncert.nic.in/textbook.php?lemh2=0-13', type: 'external', subject: 'Math' },

  // Biology
  { title: 'NCERT Biology Class 11', description: 'Official NCERT textbook chapters (free).', url: 'https://ncert.nic.in/textbook.php?kebo1=0-22', type: 'external', subject: 'Biology' },
  { title: 'NCERT Biology Class 12', description: 'Official NCERT textbook chapters (free).', url: 'https://ncert.nic.in/textbook.php?lebo1=0-16', type: 'external', subject: 'Biology' },

  // Mixed / general
  { title: 'JEE Main Past Year Papers (2015–2024)', description: 'Authoritative archive of JEE Main question papers. Use the PYQ-weighted approach: track which chapters appear most across years.', url: 'https://jeemain.nta.nic.in/previous-year-question-papers/', type: 'external', subject: 'Mixed' },
  { title: 'NEET Past Year Papers (2017–2024)', description: 'Official NEET question paper archive.', url: 'https://neet.nta.nic.in/previous-year-question-papers/', type: 'external', subject: 'Mixed' },
];
```

- [ ] **Step 2: Build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/data/materials.ts
git commit -m "feat(materials): seed catalog of NCERT, OpenStax, NTA PYQ resources

13 entries spanning Physics/Chemistry/Math/Biology + JEE/NEET PYQ
archives. All external links to free official sources, no
copyright-grey content from coaching chains."
```

---

### Task 3.2.2: Create `src/components/PreparationMaterials.tsx`

**Files:**
- Create: `src/components/PreparationMaterials.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import { materials, type MaterialSubject } from '../data/materials';

const SUBJECTS: MaterialSubject[] = ['Physics', 'Chemistry', 'Math', 'Biology', 'Mixed'];

const PreparationMaterials: React.FC = () => (
  <div className="min-h-screen bg-white">
    <head>
      <title>Preparation Materials · CampusPandit</title>
      <meta name="description" content="Free JEE/NEET preparation resources — NCERT, OpenStax, official past-year question papers." />
    </head>
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      <h1 className="text-4xl font-bold text-neutral-900 mb-4">Preparation Materials</h1>
      <p className="text-lg text-neutral-600 mb-12">
        Free, official sources for JEE and NEET preparation. NCERT textbooks, OpenStax open-license books, and the
        authoritative past-year question paper archives from NTA.
      </p>

      {SUBJECTS.map(subject => {
        const entries = materials.filter(m => m.subject === subject);
        if (entries.length === 0) return null;
        return (
          <section key={subject} className="mb-12">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-6">{subject}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {entries.map(m => (
                <a key={m.url} href={m.url} target="_blank" rel="noopener noreferrer"
                   className="block p-5 border border-neutral-200 rounded-lg hover:border-primary-500 transition group">
                  <div className="flex items-start gap-3 mb-2">
                    {m.type === 'pdf'
                      ? <FileText className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                      : <ExternalLink className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />}
                    <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600">{m.title}</h3>
                  </div>
                  <p className="text-sm text-neutral-600">{m.description}</p>
                </a>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  </div>
);

export default PreparationMaterials;
```

- [ ] **Step 2: Build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/PreparationMaterials.tsx
git commit -m "feat(materials): grid page at /materials grouped by subject"
```

---

### Task 3.3.1: Create `src/data/roadmap.ts` with placeholder items

**Files:**
- Create: `src/data/roadmap.ts`

- [ ] **Step 1: Create the data module**

```ts
// Final items written after ~2 weeks of engagement signals — see
// docs/superpowers/specs/2026-05-22-park-consumer-app-supabase-migration-design.md §5 Phase 3g.
// Edit this file directly to publish updates; no code re-deploy concerns.

export type RoadmapColumn = 'now' | 'next' | 'later';
export type RoadmapAudience = 'coaching_center' | 'prospective_cc_via_student' | 'both';

export interface RoadmapItem {
  title: string;
  description: string;
  column: RoadmapColumn;
  audience: RoadmapAudience;
}

export const items: RoadmapItem[] = [
  {
    title: 'Founding 10 pilot launch',
    description: 'First cohort of coaching centers onboarded with branded student app and AI Coach. Applications open.',
    column: 'now',
    audience: 'coaching_center',
  },
  {
    title: 'Branded student web app',
    description: 'Per-center themed PWA in 7 days from pilot start. Native Play Store wrapper rolls out in pilot month 2.',
    column: 'next',
    audience: 'coaching_center',
  },
  {
    title: 'PYQ-weighted AI Coach diagnostic',
    description: 'Personalised chapter weakness analysis using historical JEE Main and NEET question frequencies. Pilot month 2.',
    column: 'later',
    audience: 'both',
  },
];
```

- [ ] **Step 2: Build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/data/roadmap.ts
git commit -m "feat(roadmap): placeholder items pending engagement-signal data

Three certain items only. Real roadmap content lands after ~2 weeks
of LinkedIn/Twitter engagement signals + /ideas submissions."
```

---

### Task 3.3.2: Create `src/components/Roadmap.tsx`

**Files:**
- Create: `src/components/Roadmap.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React from 'react';
import { items, type RoadmapColumn, type RoadmapAudience } from '../data/roadmap';

const COLUMNS: { id: RoadmapColumn; label: string; desc: string }[] = [
  { id: 'now', label: 'Now', desc: 'Active work this quarter.' },
  { id: 'next', label: 'Next', desc: 'On deck after current work.' },
  { id: 'later', label: 'Later', desc: 'Planned but not scheduled.' },
];

const AUDIENCE_BADGE: Record<RoadmapAudience, { label: string; bg: string; text: string }> = {
  coaching_center: { label: 'Coaching center', bg: 'bg-primary-50', text: 'text-primary-700' },
  prospective_cc_via_student: { label: 'Student', bg: 'bg-success-50', text: 'text-success-700' },
  both: { label: 'Both', bg: 'bg-secondary-50', text: 'text-secondary-700' },
};

const Roadmap: React.FC = () => (
  <div className="min-h-screen bg-white">
    <head>
      <title>Roadmap · CampusPandit</title>
      <meta name="description" content="What CampusPandit is building now, next, and later — public transparency." />
    </head>
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      <h1 className="text-4xl font-bold text-neutral-900 mb-4">Roadmap</h1>
      <p className="text-lg text-neutral-600 mb-12">
        Public transparency on what we are building. Updated as we learn — no dates, only priority.
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        {COLUMNS.map(col => {
          const entries = items.filter(i => i.column === col.id);
          return (
            <div key={col.id} className="bg-neutral-50 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-1">{col.label}</h2>
              <p className="text-sm text-neutral-500 mb-6">{col.desc}</p>
              <ul className="space-y-4">
                {entries.map(item => {
                  const badge = AUDIENCE_BADGE[item.audience];
                  return (
                    <li key={item.title} className="bg-white p-4 rounded-lg border border-neutral-200">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-neutral-900">{item.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${badge.bg} ${badge.text} flex-shrink-0`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600">{item.description}</p>
                    </li>
                  );
                })}
                {entries.length === 0 && (
                  <li className="text-sm text-neutral-400 italic">Nothing here yet.</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </main>
  </div>
);

export default Roadmap;
```

- [ ] **Step 2: Build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Roadmap.tsx
git commit -m "feat(roadmap): Now/Next/Later columns with audience badges"
```

---

### Task 3.4.1: Create `src/utils/supabaseObserve.ts`

**Files:**
- Create: `src/utils/supabaseObserve.ts`

- [ ] **Step 1: Create the file**

```ts
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_OBSERVE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_OBSERVE_ANON_KEY;

if (!url || !anonKey) {
  console.warn('[supabaseObserve] env vars missing — observe-window features will fail.');
}

// Separate Supabase client for the observe-window project — distinct from
// `src/utils/supabase.ts` which talks to the question-bank project.
export const supabaseObserve = createClient(url ?? '', anonKey ?? '', {
  auth: {
    storageKey: 'campuspandit-observe-auth-storage',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: { enabled: false },
});
```

- [ ] **Step 2: Build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/utils/supabaseObserve.ts
git commit -m "feat(supabase): second client for the observe-window project

Distinct from the question-bank client — different storageKey so
auth sessions do not collide. Realtime disabled."
```

---

### Task 3.4.2: Create `src/components/Ideas.tsx`

**Files:**
- Create: `src/components/Ideas.tsx`

- [ ] **Step 1: Create the component (form + list, no upvote yet)**

```tsx
import React, { useEffect, useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import { supabaseObserve } from '../utils/supabaseObserve';

type Audience = 'coaching_center' | 'prospective_cc_via_student' | 'both';

interface Idea {
  id: string;
  title: string;
  description: string | null;
  audience: Audience;
  upvotes: number;
  created_at: string;
}

const Ideas: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [audience, setAudience] = useState<Audience>('coaching_center');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [published, setPublished] = useState<Idea[]>([]);

  useEffect(() => {
    void loadPublished();
  }, []);

  async function loadPublished() {
    const { data, error: e } = await supabaseObserve
      .from('feature_requests')
      .select('id, title, description, audience, upvotes, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(10);
    if (e) console.error('Failed to load published ideas:', e);
    if (data) setPublished(data as Idea[]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: insertError } = await supabaseObserve
      .from('feature_requests')
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        audience,
        submitter_email: email.trim() || null,
      });
    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setSubmitted(true);
    setTitle(''); setDescription(''); setEmail('');
    // Plausible custom event
    (window as any).plausible?.('feature_request_submitted', { props: { audience } });
  }

  return (
    <div className="min-h-screen bg-white">
      <head>
        <title>Ideas · CampusPandit</title>
        <meta name="description" content="Suggest features for CampusPandit. Coaching center owners and students welcome." />
      </head>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <h1 className="text-4xl font-bold text-neutral-900 mb-4">Ideas</h1>
        <p className="text-lg text-neutral-600 mb-10">
          What should CampusPandit build next? Coaching center owners and students both welcome.
        </p>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Submit an idea</h2>
          {submitted ? (
            <div className="p-6 bg-success-50 border border-success-200 rounded-lg">
              <p className="text-success-700 font-medium mb-2">Thanks — we&apos;ll review and publish soon.</p>
              <button onClick={() => setSubmitted(false)} className="text-sm text-primary-500 hover:underline">
                Submit another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Title <span className="text-red-500">*</span></label>
                <input
                  type="text" required minLength={3} maxLength={120}
                  value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Details (optional)</label>
                <textarea
                  rows={4} maxLength={2000}
                  value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">This idea is for:</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  {(['coaching_center', 'prospective_cc_via_student', 'both'] as Audience[]).map(a => (
                    <label key={a} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio" name="audience" value={a}
                        checked={audience === a} onChange={() => setAudience(a)}
                      />
                      <span className="text-sm text-neutral-700">
                        {a === 'coaching_center' ? 'Coaching centers' : a === 'prospective_cc_via_student' ? 'Students' : 'Both'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Your email (optional — for follow-up)</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit" disabled={submitting}
                className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition"
              >
                {submitting ? 'Submitting…' : 'Submit idea'}
              </button>
            </form>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Recently published ideas</h2>
          {published.length === 0 && <p className="text-neutral-500">No published ideas yet — yours could be the first.</p>}
          <ul className="space-y-4">
            {published.map(idea => (
              <li key={idea.id} className="p-5 border border-neutral-200 rounded-lg">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="font-semibold text-neutral-900">{idea.title}</h3>
                  <button
                    type="button" aria-disabled="true"
                    title="Sign in to upvote (coming soon)"
                    className="flex items-center gap-1 px-3 py-1 text-sm text-neutral-500 bg-neutral-100 rounded-full cursor-not-allowed"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    {idea.upvotes}
                  </button>
                </div>
                {idea.description && <p className="text-sm text-neutral-600 mb-2">{idea.description}</p>}
                <p className="text-xs text-neutral-400">
                  {idea.audience === 'coaching_center' ? 'For coaching centers'
                   : idea.audience === 'prospective_cc_via_student' ? 'For students'
                   : 'For both'}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
};

export default Ideas;
```

- [ ] **Step 2: Build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Ideas.tsx
git commit -m "feat(ideas): submission form + published list; upvote disabled until Stage 2

Anonymous submission lands in feature_requests on the observe project.
Upvote button visible but disabled with tooltip 'Sign in to upvote
(coming soon)' — Phase 3.5 wires it to feature_request_votes."
```

---

### Task 3.7.1: Create `src/components/PilotApplication.tsx`

**Files:**
- Create: `src/components/PilotApplication.tsx`

- [ ] **Step 1: Create the component**

```tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseObserve } from '../utils/supabaseObserve';

const SUBJECT_OPTIONS = ['Physics', 'Chemistry', 'Math', 'Biology', 'JEE Combined', 'NEET Combined', 'Other'];

const PilotApplication: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    center_name: '', owner_name: '', location: '',
    students_count: '', current_software: '', website_or_instagram: '',
    contact_email: '', contact_phone: '', message: '',
  });
  const [subjects, setSubjects] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleSubject(s: string) {
    setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (subjects.length === 0) {
      setError('Please select at least one subject.');
      setSubmitting(false);
      return;
    }

    const studentsCount = parseInt(form.students_count, 10);
    if (Number.isNaN(studentsCount) || studentsCount < 1 || studentsCount > 100000) {
      setError('Number of students must be between 1 and 100000.');
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabaseObserve
      .from('pilot_applications')
      .insert({
        center_name: form.center_name.trim(),
        owner_name: form.owner_name.trim(),
        location: form.location.trim(),
        students_count: studentsCount,
        subjects_taught: subjects,
        current_software: form.current_software.trim() || null,
        website_or_instagram: form.website_or_instagram.trim() || null,
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim() || null,
        message: form.message.trim() || null,
      });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    (window as any).plausible?.('pilot_application_submitted', {
      props: { students_count_bucket: studentsCount < 100 ? '<100' : studentsCount < 500 ? '100-499' : studentsCount < 1000 ? '500-999' : '1000+' }
    });

    navigate('/apply/thanks');
  }

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  return (
    <div className="min-h-screen bg-white">
      <head>
        <title>Apply for the Founding 10 pilot · CampusPandit</title>
        <meta name="description" content="Apply to join the CampusPandit Founding 10 pilot — three months free, founder pricing locked for life." />
      </head>
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <h1 className="text-4xl font-bold text-neutral-900 mb-4">Apply for the Founding 10 pilot</h1>
        <p className="text-lg text-neutral-600 mb-10">
          Tell us about your coaching center. We review within 48 hours and reach out for a 20-minute call if there&apos;s fit.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Coaching center name" required>
            <input type="text" required value={form.center_name} onChange={update('center_name')} className={inputClass} />
          </Field>
          <Field label="Your name" required>
            <input type="text" required value={form.owner_name} onChange={update('owner_name')} className={inputClass} />
          </Field>
          <Field label="Location (city, state)" required>
            <input type="text" required value={form.location} onChange={update('location')} className={inputClass} />
          </Field>
          <Field label="Number of students" required>
            <input type="number" required min={1} max={100000} value={form.students_count} onChange={update('students_count')} className={inputClass} />
          </Field>
          <Field label="Subjects taught" required>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_OPTIONS.map(s => (
                <button
                  key={s} type="button" onClick={() => toggleSubject(s)}
                  className={`px-3 py-1 rounded-full text-sm border transition ${
                    subjects.includes(s)
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'bg-white text-neutral-700 border-neutral-300 hover:border-primary-500'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Field>
          <Field label="What do you currently use? (LMS, CRM, WhatsApp groups, spreadsheets…)">
            <input type="text" value={form.current_software} onChange={update('current_software')} className={inputClass} />
          </Field>
          <Field label="Website or Instagram handle">
            <input type="text" value={form.website_or_instagram} onChange={update('website_or_instagram')} className={inputClass} />
          </Field>
          <Field label="Contact email" required>
            <input type="email" required value={form.contact_email} onChange={update('contact_email')} className={inputClass} />
          </Field>
          <Field label="Contact phone (optional)">
            <input type="tel" value={form.contact_phone} onChange={update('contact_phone')} className={inputClass} />
          </Field>
          <Field label="Anything else we should know?">
            <textarea rows={4} maxLength={4000} value={form.message} onChange={update('message')} className={inputClass} />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit" disabled={submitting}
            className="w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition font-medium"
          >
            {submitting ? 'Submitting…' : 'Submit application'}
          </button>
          <p className="text-xs text-neutral-500 text-center">
            We respond within 48 hours · No sales calls without your ask
          </p>
        </form>
      </main>
    </div>
  );
};

const inputClass = 'w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

interface FieldProps { label: string; required?: boolean; children: React.ReactNode; }
const Field: React.FC<FieldProps> = ({ label, required, children }) => (
  <div>
    <label className="block text-sm font-medium text-neutral-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

export default PilotApplication;
```

- [ ] **Step 2: Build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/PilotApplication.tsx
git commit -m "feat(apply): Founding 10 pilot application form

Form posts to pilot_applications on the observe project. Required
ICP-fit fields (center, location, students_count, subjects) are
enforced both client-side and server-side via table CHECK constraints.
Fires Plausible custom event pilot_application_submitted then routes
to /apply/thanks."
```

---

### Task 3.7.2: Create `src/components/PilotApplicationThanks.tsx`

**Files:**
- Create: `src/components/PilotApplicationThanks.tsx`
- Modify: `src/App.tsx` (commit the dirty changes from Task 3.0.1)

- [ ] **Step 1: Create the component**

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

const PilotApplicationThanks: React.FC = () => (
  <div className="min-h-screen bg-white">
    <head>
      <title>Thanks — application received · CampusPandit</title>
      <meta name="description" content="Your Founding 10 pilot application has been received. We'll review within 48 hours." />
    </head>
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-center">
      <CheckCircle className="w-16 h-16 text-success-500 mx-auto mb-6" />
      <h1 className="text-4xl font-bold text-neutral-900 mb-4">Application received</h1>
      <p className="text-lg text-neutral-600 mb-10">
        Thanks — we&apos;ll review within 48 hours and reach out to schedule a 20-minute call if there&apos;s fit.
      </p>
      <Link
        to="/roadmap"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-medium"
      >
        See what we&apos;re building next
        <ArrowRight className="w-4 h-4" />
      </Link>
    </main>
  </div>
);

export default PilotApplicationThanks;
```

- [ ] **Step 2: Build (now all components exist; the Task 3.0.1 `App.tsx` change should compile cleanly)**

```bash
npm run build
```
Expected: build succeeds with no missing-module errors.

- [ ] **Step 3: Commit (bundles `App.tsx` route additions from Task 3.0.1 with the final missing component)**

```bash
git add src/components/PilotApplicationThanks.tsx src/App.tsx
git commit -m "feat(apply): thanks page + wire 7 new public routes

App.tsx adds lazy imports and Route entries for /blog, /blog/:slug,
/materials, /roadmap, /ideas, /apply, /apply/thanks. All routes
public, no auth wrapping."
```

---

### Task 3.5.1: Add `Blog · Roadmap · Ideas` to `LandingPage.tsx` nav

**Files:**
- Modify: `src/components/LandingPage.tsx`

- [ ] **Step 1: Add nav links to the desktop nav (~line 38–44)**

Find the existing desktop nav section:
```tsx
<a href="#features" className="...">Platform</a>
<a href="#how-it-works" className="...">How it works</a>
<a href="#pricing" className="...">Pricing</a>
<a href="#faq" className="...">FAQ</a>
<a href="/for-students" className="...">For students</a>
```

Add three more after `FAQ`, before `For students`:
```tsx
<a href="/blog" className="text-sm text-neutral-600 hover:text-primary-500 transition-colors">Blog</a>
<a href="/roadmap" className="text-sm text-neutral-600 hover:text-primary-500 transition-colors">Roadmap</a>
<a href="/ideas" className="text-sm text-neutral-600 hover:text-primary-500 transition-colors">Ideas</a>
```

- [ ] **Step 2: Add the same three to the mobile menu**

In the mobile-menu block (around lines 66–84), add three new entries after `FAQ` and before `For students`:
```tsx
<a href="/blog" className="block py-2 text-sm text-neutral-600 hover:text-primary-500">Blog</a>
<a href="/roadmap" className="block py-2 text-sm text-neutral-600 hover:text-primary-500">Roadmap</a>
<a href="/ideas" className="block py-2 text-sm text-neutral-600 hover:text-primary-500">Ideas</a>
```

- [ ] **Step 3: Build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/LandingPage.tsx
git commit -m "feat(landing): add Blog/Roadmap/Ideas to desktop and mobile nav"
```

---

### Task 3.5.2: Add `Blog · Materials · Roadmap · Ideas` to `LandingPageStudent.tsx` nav

**Files:**
- Modify: `src/components/LandingPageStudent.tsx`

- [ ] **Step 1: Add four nav links to the desktop nav**

Locate the desktop nav block in `LandingPageStudent.tsx` (mirrors `LandingPage.tsx`'s structure, ~lines 30–50). Find the existing nav anchors (likely Features / How it works / Pricing / FAQ) and insert these four anchors after the last existing one, before the right-side login/CTA buttons:

```tsx
<a href="/blog" className="text-sm text-neutral-600 hover:text-primary-500 transition-colors">Blog</a>
<a href="/materials" className="text-sm text-neutral-600 hover:text-primary-500 transition-colors">Materials</a>
<a href="/roadmap" className="text-sm text-neutral-600 hover:text-primary-500 transition-colors">Roadmap</a>
<a href="/ideas" className="text-sm text-neutral-600 hover:text-primary-500 transition-colors">Ideas</a>
```

- [ ] **Step 2: Add the same four to the mobile menu**

Find the `{mobileMenuOpen && (` block in the same file (typically ~lines 55–80). Insert these four anchors among the existing mobile nav links:

```tsx
<a href="/blog" className="block py-2 text-sm text-neutral-600 hover:text-primary-500">Blog</a>
<a href="/materials" className="block py-2 text-sm text-neutral-600 hover:text-primary-500">Materials</a>
<a href="/roadmap" className="block py-2 text-sm text-neutral-600 hover:text-primary-500">Roadmap</a>
<a href="/ideas" className="block py-2 text-sm text-neutral-600 hover:text-primary-500">Ideas</a>
```

- [ ] **Step 3: Build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/LandingPageStudent.tsx
git commit -m "feat(landing-students): add Blog/Materials/Roadmap/Ideas to nav"
```

---

### Task 3.6.1: Update `public/robots.txt` for new public routes

**Files:**
- Modify (or create): `public/robots.txt`

- [ ] **Step 1: Read current contents**

```bash
cat public/robots.txt
```

- [ ] **Step 2: Ensure these directives exist (add if missing, keep existing `Sitemap:` line)**

```
User-agent: *
Allow: /
Allow: /for-students
Allow: /blog/
Allow: /materials
Allow: /roadmap
Allow: /ideas
Allow: /apply
Disallow: /auth
Disallow: /coach
Disallow: /messages
Disallow: /crm
Disallow: /courses
Disallow: /library
Disallow: /tutor
Disallow: /instructor
Disallow: /admin
Disallow: /preferences

Sitemap: https://www.campuspandit.ai/sitemap.xml
```

The `Disallow` lines stop crawlers from indexing routes that redirect to `/` (they'd be wasted budget).

- [ ] **Step 3: Verify**

```bash
cat public/robots.txt
```

- [ ] **Step 4: Commit**

```bash
git add public/robots.txt
git commit -m "build(seo): robots.txt allows new public routes, disallows parked ones"
```

---

### Task 3.6.2: Update sitemap generation to include new routes

**Files:** depends on existing setup — modify `scripts/prerender.js` (which is also producing sitemap) OR `public/sitemap.xml` if it's static

- [ ] **Step 1: Locate sitemap generation**

```bash
grep -rn "sitemap" scripts/ public/ 2>/dev/null
```

- [ ] **Step 2a (if `public/sitemap.xml` exists as static): edit it to add new URLs**

```xml
<url><loc>https://www.campuspandit.ai/blog</loc><changefreq>weekly</changefreq></url>
<url><loc>https://www.campuspandit.ai/blog/running-a-coaching-center-like-a-saas</loc></url>
<url><loc>https://www.campuspandit.ai/blog/jee-prep-the-honest-version</loc></url>
<url><loc>https://www.campuspandit.ai/materials</loc></url>
<url><loc>https://www.campuspandit.ai/roadmap</loc></url>
<url><loc>https://www.campuspandit.ai/ideas</loc></url>
<url><loc>https://www.campuspandit.ai/apply</loc></url>
```

- [ ] **Step 2b (if generated by prerender script): the route list edit in Task 3.1.5 already handles it. Verify the generator outputs sitemap.xml.**

```bash
npm run build:seo
ls dist/sitemap.xml
cat dist/sitemap.xml | head -20
```

- [ ] **Step 3: Commit (only if files changed)**

```bash
git add public/sitemap.xml  # or whatever changed
git commit -m "build(seo): sitemap includes new public routes"
```

---

### Task 3.6.3: Submit updated sitemap to Google Search Console (post-deploy, manual)

**Files:** none

- [ ] **Step 1: After Phase 3 is deployed, go to Search Console**

https://search.google.com/search-console — pick the `campuspandit.ai` property.

- [ ] **Step 2: Sitemaps → Add a new sitemap**

Submit URL: `https://www.campuspandit.ai/sitemap.xml`

- [ ] **Step 3: URL Inspection for each new route**

For each of `/blog`, `/materials`, `/roadmap`, `/ideas`, `/apply` — paste the URL, click "Request Indexing." Indexing typically takes 1–3 days for an established domain.

- [ ] **Step 4: No commit (manual operation)**

---

### Task 3.8.1: Soften Pillar 1 (Branded App) copy in `LandingPage.tsx`

**Files:**
- Modify: `src/components/LandingPage.tsx`

- [ ] **Step 1: Find Pillar 1 section (around lines 257–293)**

Look for `<h3 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-4">Your brand. Your app. Your domain.</h3>`.

- [ ] **Step 2: Replace the headline**

```
"Your brand. Your app. Your domain."
```
becomes:
```
"Your brand. Your web app in 7 days · native app by month 2."
```

- [ ] **Step 3: Replace the paragraph**

Current:
> Students download _your center's name_, not ours. Your logo on the splash screen, your domain in the URL, your fees in the checkout. CampusPandit disappears — we're just the engine underneath.

New:
> Students access _your center's name_, not ours. Your logo on the splash screen, your domain in the URL, your fees in the checkout. CampusPandit disappears — we're just the engine underneath. Branded web app launches in 7 days; native Play Store wrapper rolls out in pilot month 2–3.

- [ ] **Step 4: Adjust the bulleted list to match**

Current:
- "Custom logo, colors, and domain (your-center.app)"
- "Published to Play Store under your brand"
- "All payments go to your Razorpay / PayU account"

New:
- "Custom logo, colors, and domain (your-center.app)"
- "Branded web app in 7 days · native Play Store app in pilot month 2–3"
- "All payments go to your Razorpay / PayU account"

- [ ] **Step 5: Build**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/components/LandingPage.tsx
git commit -m "feat(landing): soften Pillar 1 branded-app claims to match codebase

Web app in 7 days is honest; native Play Store wrapper is real but
requires TWA/Bubblewrap work during pilot month 2-3. Rather than
overpromise, set the staged expectation up front."
```

---

### Task 3.8.2: Soften Pillar 3 (Center Dashboard) copy in `LandingPage.tsx`

**Files:**
- Modify: `src/components/LandingPage.tsx`

- [ ] **Step 1: Find Pillar 3 bulleted list (around lines 346–359)**

- [ ] **Step 2: Replace two bullets**

Current:
- "Weekly 'at-risk students' report for the owner"
- "Tutor performance, session attendance, and earnings"

New:
- "Weekly 'at-risk students' report — rolling out in pilot month 2"
- "Tutor performance roll-up — rolling out in pilot month 2"

- [ ] **Step 3: Build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/LandingPage.tsx
git commit -m "feat(landing): soften Pillar 3 dashboard claims; ship-date in pilot month 2"
```

---

### Task 3.8.3: Soften Pricing card "Founding 10" stat copy

**Files:**
- Modify: `src/components/LandingPage.tsx`

- [ ] **Step 1: Find the Pilot pricing card (around lines 484–523)**

- [ ] **Step 2: Replace the bullet**

Current:
- "Branded app published in 7 days"

New:
- "Branded student web app published in 7 days"

- [ ] **Step 3: Build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/LandingPage.tsx
git commit -m "feat(landing): pricing card aligns with softened Pillar 1 copy"
```

---

### Task 3.9.1: Sign up for Plausible + configure goals (manual)

**Files:** none

- [ ] **Step 1: Create Plausible account at https://plausible.io**

Choose Starter ($9/mo, 10k pageviews — plenty for observe-mode).

- [ ] **Step 2: Add `campuspandit.ai` as the site property**

Copy the snippet Plausible gives — used in Task 3.9.2.

- [ ] **Step 3: In Goals & Funnels, create**

- Goal type **Custom event** → name `pilot_application_submitted`
- Goal type **Custom event** → name `feature_request_submitted`
- Goal type **Pageview** → URL pattern `/apply/thanks`
- Goal type **Outbound link** → Plausible's auto-tracker handles all `mailto:` clicks under "Outbound Links" already

- [ ] **Step 4: No commit (Plausible account setup is external)**

---

### Task 3.9.2: Add Plausible script to `index.html`

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Insert the script tag inside `<head>` (before `</head>`)**

```html
<script defer data-domain="campuspandit.ai" src="https://plausible.io/js/script.outbound-links.tagged-events.js"></script>
<script>window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }</script>
```

The second `<script>` block defines a queue so calls to `plausible(...)` made before the deferred script loads are buffered.

- [ ] **Step 2: Build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat(analytics): wire Plausible cookieless analytics

Domain campuspandit.ai. Includes outbound-link tracking and
tagged-events build so custom events from PilotApplication.tsx and
Ideas.tsx land in the Plausible dashboard."
```

---

### Task 3.9.3: Document UTM convention for social posts

**Files:**
- Create: `docs/superpowers/queries/utm-convention.md`

- [ ] **Step 1: Create the doc**

```markdown
# UTM convention for CampusPandit social posts

Every link from a LinkedIn or Twitter post to `www.campuspandit.ai` MUST follow this format:

    https://www.campuspandit.ai/<path>?utm_source=<linkedin|twitter>&utm_medium=social&utm_campaign=<post_topic>

`post_topic` MUST match the `post_topic` value you enter into the `engagement_signals` row for that post.

Seed `post_topic` values:
- `b2b-pitch` — main Founding 10 announcement on LinkedIn
- `roadmap-launch` — when /roadmap goes live
- `blog-share-b2b` — when a coaching-center-targeted blog post is shared
- `blog-share-student` — when a student-targeted blog post is shared
- `materials-share` — when a /materials resource is referenced
- `founder-story` — personal narrative content

Example:
- `https://www.campuspandit.ai/?utm_source=linkedin&utm_medium=social&utm_campaign=b2b-pitch`
- `https://www.campuspandit.ai/blog/jee-prep-the-honest-version?utm_source=twitter&utm_medium=social&utm_campaign=blog-share-student`

Plausible automatically reports `utm_source` / `utm_medium` / `utm_campaign` breakdowns in its dashboard.
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/queries/utm-convention.md
git commit -m "docs(seo): UTM convention for social posts"
```

---

### Task 3.10.1: Deploy + smoke test entire Phase 3

**Files:** none

- [ ] **Step 1: Push everything to main**

```bash
git push origin main
```

- [ ] **Step 2: Wait for Azure SWA deploy + prerender**

```bash
gh run watch
```

- [ ] **Step 3: Incognito smoke test each new route**

- `https://www.campuspandit.ai/blog` — listing page renders with two posts, filter chips work
- `https://www.campuspandit.ai/blog/jee-prep-the-honest-version` — detail page renders with markdown, meta tags
- `https://www.campuspandit.ai/materials` — grid renders, NCERT links open externally
- `https://www.campuspandit.ai/roadmap` — three columns with placeholder items
- `https://www.campuspandit.ai/ideas` — form submits successfully (test with a real submission, then mark `is_published = true` in Supabase Studio so it appears in the list)
- `https://www.campuspandit.ai/apply` — form submits successfully; redirects to `/apply/thanks`
- `https://www.campuspandit.ai/apply/thanks` — confirmation page renders

- [ ] **Step 4: Verify Plausible**

Open Plausible dashboard. Confirm:
- Pageviews are landing in real-time
- The test `pilot_application_submitted` event fired (filter the dashboard by that event)
- The test `feature_request_submitted` event fired

- [ ] **Step 5: Clean up test rows**

```sql
-- In Supabase Studio
DELETE FROM pilot_applications WHERE center_name LIKE '%test%' OR center_name LIKE '%Test%';
DELETE FROM feature_requests WHERE title LIKE '%test%' OR title LIKE '%Test%';
```

- [ ] **Step 6: No commit (smoke test only)**

---

## Phase 4 — Shut Down Azure Compute and DB

### Task 4.1: Verify Blob snapshot integrity

**Files:** none

- [ ] **Step 1: Confirm blob exists and size matches**

```bash
az storage blob show \
  --container-name db-backups --account-name <storage-account> \
  --name campuspandit-2026-05-22.dump --query 'properties.contentLength'
```
Compare to the local file size from Task 1.1.

- [ ] **Step 2: Download a fresh copy and verify `pg_restore --list` enumerates tables**

```bash
az storage blob download --container-name db-backups --account-name <storage-account> \
  --name campuspandit-2026-05-22.dump --file /tmp/verify.dump
pg_restore --list /tmp/verify.dump | wc -l
# Expected: hundreds of lines (tables, indexes, constraints, etc.)
rm /tmp/verify.dump
```

If the line count is unexpectedly low, abort — do NOT proceed to delete the Azure server.

- [ ] **Step 3: No commit**

---

### Task 4.2: Scale Container App to 0 replicas

**Files:** none

- [ ] **Step 1: Update replicas**

```bash
az containerapp update \
  --name campuspandit-backend-prod \
  --resource-group campuspandit-rg-prod \
  --min-replicas 0 --max-replicas 0
```

- [ ] **Step 2: Verify zero replicas active**

```bash
az containerapp revision list \
  --name campuspandit-backend-prod \
  --resource-group campuspandit-rg-prod \
  --query "[].{name:name, active:properties.active, replicas:properties.replicas}"
```
Expected: zero replicas across all revisions.

- [ ] **Step 3: No commit**

---

### Task 4.3: Delete Azure Postgres Flexible Server

**Files:** none

- [ ] **Step 1: Final pre-deletion check**

Re-confirm Task 4.1 step 1 passes. If anything looks off, stop.

- [ ] **Step 2: Delete the server**

```bash
az postgres flexible-server delete \
  --name campuspandit-db \
  --resource-group campuspandit-rg-prod \
  --yes
```
Expected: command returns after ~1–2 minutes. Server resource is gone.

- [ ] **Step 3: Verify**

```bash
az postgres flexible-server list --resource-group campuspandit-rg-prod
```
Expected: empty array.

- [ ] **Step 4: No commit**

---

### Task 4.4: Set Azure cost alert at $20/mo

**Files:** none

- [ ] **Step 1: Create budget via Portal (recommended — CLI syntax is brittle across Azure CLI versions)**

Portal path: Subscription → Cost Management → Budgets → Add.
- Budget name: `campuspandit-observe-budget`
- Scope: Resource group `campuspandit-rg-prod`
- Reset period: Monthly
- Start date: 2026-05-01
- Expiry: 2026-12-31
- Amount: 20 USD
- Alert at 80% of budget → email `founders@campuspandit.ai`
- Alert at 100% of budget → email `founders@campuspandit.ai`

CLI path (only if you prefer scripting and know your `az` version supports `consumption budget create` with inline notifications JSON):
```bash
az consumption budget create \
  --budget-name campuspandit-observe-budget \
  --amount 20 --category Cost --time-grain Monthly \
  --start-date "2026-05-01" --end-date "2026-12-31" \
  --resource-group campuspandit-rg-prod \
  --notifications-enabled true \
  --notifications "[{\"enabled\":true,\"operator\":\"GreaterThan\",\"threshold\":80,\"contactEmails\":[\"founders@campuspandit.ai\"]},{\"enabled\":true,\"operator\":\"GreaterThan\",\"threshold\":100,\"contactEmails\":[\"founders@campuspandit.ai\"]}]"
```
If the CLI errors with a parameter-parsing complaint, fall back to the Portal path above.

- [ ] **Step 2: Verify**

```bash
az consumption budget list --resource-group campuspandit-rg-prod --query "[].{name:name, amount:amount.value}"
```

- [ ] **Step 3: No commit**

---

## Phase 5 — Verify and Document

### Task 5.1: Cost screenshot baseline

**Files:**
- Create: `docs/superpowers/specs/2026-05-22-cost-before.png` (manual screenshot)

- [ ] **Step 1: Open Azure Cost Management → Cost Analysis for the last 30 days**

- [ ] **Step 2: Take a screenshot of the chart showing the pre-park spend**

- [ ] **Step 3: Save to `docs/superpowers/specs/2026-05-22-cost-before.png` and commit**

```bash
git add docs/superpowers/specs/2026-05-22-cost-before.png
git commit -m "docs(cost): baseline screenshot pre-park (2026-05-22)"
```

- [ ] **Step 4: Set a calendar reminder for 2026-05-29 to take `2026-05-29-cost-after-7d.png`**

The first week's cost drop is the headline win to verify the park worked.

---

### Task 5.2: Update README with pilot status

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add a "Pilot Status" section near the top, right under the project title**

```markdown
## Pilot Status (2026-05-22 → ~2026-08-21)

CampusPandit is in a **3-month observe window** — consumer app parked, B2B
Founding 10 landing live at https://www.campuspandit.ai. See the spec at
[`docs/superpowers/specs/2026-05-22-park-consumer-app-supabase-migration-design.md`](docs/superpowers/specs/2026-05-22-park-consumer-app-supabase-migration-design.md)
for the full plan, kill/keep gates, and Stage 2 conditional rollout.

Domain glossary: [`CONTEXT.md`](CONTEXT.md).
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs(readme): add pilot-status pointer to spec and CONTEXT.md"
```

---

### Task 5.3: Update project memory entries

**Files:**
- Modify: `C:/Users/sreek/.claude/projects/c--Users-sreek-myprojects-campuspandit/memory/project_bandwidth_and_park.md` (currently says "4-week observe mode")
- Modify: `C:/Users/sreek/.claude/projects/c--Users-sreek-myprojects-campuspandit/memory/MEMORY.md` (one-liner about 4 weeks)
- Modify: `C:/Users/sreek/.claude/projects/c--Users-sreek-myprojects-campuspandit/memory/project_domain_setup.md` (mention `.ai` canonical)

- [ ] **Step 1: Update `project_bandwidth_and_park.md`**

Change "4-week observe mode from 2026-05-21" → "3-month observe window from 2026-05-21 → ~2026-08-21." Note the Stage 1 / Stage 2 split.

- [ ] **Step 2: Update MEMORY.md one-liner**

The entry pointing at `project_bandwidth_and_park.md` should say "3-month observe window," not "4-week."

- [ ] **Step 3: Update `project_domain_setup.md`**

Add: canonical contact domain is now `@campuspandit.ai`; `@campuspandit.com` is a Workspace alias.

- [ ] **Step 4: No commit (memory lives outside the repo)**

---

### Task 5.4: Run engagement-signals queries Q1–Q6 sanity check

**Files:** none

- [ ] **Step 1: Open Supabase Studio SQL Editor on the new project**

- [ ] **Step 2: Run each query from `docs/superpowers/queries/engagement-signals.sql`**

For each: confirm the query parses and returns empty result sets (since no signals have been captured yet). This validates the schemas, not the data.

- [ ] **Step 3: No commit (verification only)**

---

## End-of-plan checklist

- [ ] All five phases complete.
- [ ] Cost screenshot baseline saved.
- [ ] `pilot_applications` form accepts submissions and writes to Supabase.
- [ ] `Ideas` form accepts submissions and renders published ideas.
- [ ] Plausible dashboard shows pageviews for the new routes.
- [ ] Azure Postgres deleted, Container App at 0 replicas, Blob snapshot verified.
- [ ] Cost alert at $20/mo configured.
- [ ] LinkedIn post can now go out — Stage 1 measurement is live.

**Next:** schedule a calendar reminder for **2026-06-19** to check the Stage 1 thresholds against `docs/superpowers/queries/stage-gates.md`. If ≥4 of 5 trip, execute `docs/superpowers/plans/2026-05-22-stage-2-magic-link.md` (separate plan, to be written when Stage 2 is triggered).
