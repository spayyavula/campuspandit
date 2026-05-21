# Park Consumer App + Migrate Azure Postgres to Supabase

Date: 2026-05-22
Status: Approved for implementation (observe-window phases)
Owner: Sreekanth Payyavula

## 1. Context

CampusPandit is in a **3-month observe window** (2026-05-21 → ~2026-08-21) following the B2B coaching-center pivot. The homepage at `www.campuspandit.ai` is now a Founding 10 landing page; everything behind `/auth` is the legacy consumer app (students, tutors, courses, CRM, messaging, video library).

The observe window is structured as a **two-stage test** (terms defined in `CONTEXT.md`):
- **Stage 1 (~weeks 1–4):** measure on-site engagement via Plausible Analytics. No auth. Goal: determine whether the audience is engaged enough to warrant testing conversion.
- **Stage 2 (~weeks 5–12, conditional):** if Stage 1 trips its thresholds, magic-link auth rolls out as a conversion mechanism. Measure: what fraction of visitors convert (passive waitlist OR active upvote on `/ideas`).

Current production cost is ~$60–115/mo for infrastructure that, during the observe window, serves no traffic the observe signal cares about. The observe signal comes from LinkedIn/Twitter engagement on the B2B landing, completed `pilot_applications` form submissions, `/ideas` submissions, and (conditionally) Stage 2 magic-link signups — none of which touches the Container App or Azure Postgres.

This spec covers (a) the work to be done **during** the observe window (park + DB migration + content layer + Stage 1 measurement + conditional Stage 2) and (b) the documented design for the restart path **if** the observe verdict at end of month 3 is "keep going."

## 2. Goals and non-goals

**Goals:**
- Drop monthly infrastructure cost from ~$60–115/mo to ~$5–25/mo within the observe window (Plausible adds ~$9/mo).
- Preserve all data in Azure Postgres so the restart path is not blocked by data loss.
- Keep `www.campuspandit.ai` (`/` and `/for-students`) serving normally throughout.
- Capture the SSE → Supabase Realtime design in writing so a restart decision is not blocked on re-deriving the architecture.
- Thicken the public surface with four content sections (Blog, Preparation Materials, Roadmap, Ideas/Feature Request) plus the Pilot Application form, so the observe window has rich signals to measure beyond a single landing scroll.
- Replace the legacy `mailto:` Founding 10 CTA with a custom Supabase form (`pilot_applications`) so completed applications — not just intent-to-apply clicks — are measurable.
- Soften landing copy on the Branded App and Center Dashboard claims so the marketing matches what the team can actually deliver in 7 days vs. month 2 (see `CONTEXT.md` → Branded PWA, Branded Play Store App, Center Dashboard).
- Install Plausible Analytics ($9/mo) for Stage 1 engagement measurement: sessions, duration, pages-per-session, scroll depth, UTM source.
- Define a **conditional Stage 2** magic-link rollout, fired only if Stage 1 trips ≥4 of 5 numeric thresholds (defined in Phase 3j) — and capture conversions as either passive (email-on-list) or active (auth-gated upvote on `/ideas`).
- Set up the manual Constant Contact sync workflow so observe-window email nurture can run without building Edge Function automation up-front.

**Non-goals (observe window):**
- Re-architecting the FastAPI backend.
- Implementing SSE → Supabase Realtime swap (designed in §6, implemented only on restart).
- Building the Branded Play Store App pipeline (TWA/Bubblewrap) — out of scope until a Founding 10 is signed.
- Building the at-risk-students / tutor-performance Center Dashboard surfaces — Pilot month 2 work.
- Automated Constant Contact integration (Edge Function proxy) — manual CSV sync covers observe scale; automation is post-observe if verdict is "keep."
- Consolidating the existing question-bank Supabase project with the new user-data project.
- Re-pointing `campuspandit.com` WordPress redirect.
- Building any login-form auth UI **before** Stage 2 fires. If Stage 1 fails its thresholds, no auth UI ever ships during observe.

## 3. Current architecture (as discovered)

Two production databases already exist:

- **Supabase project `ecnrvbyzbfhrorxwxkms`** (existing) — question bank: `questions`, `question_options`, `question_collections`, `student_responses`, `question_analytics`. Used directly from the frontend via `src/utils/supabase.ts`. Realtime is explicitly disabled.
- **Azure Postgres Flexible Server (B1ms)** — accessed only via the FastAPI Container App at `campuspandit-backend.delightfulpond-e2c9744c.eastus.azurecontainerapps.io`. Holds users, auth, courses, lessons, channels/messages, reactions, tutoring, CRM, video library, payments.

Frontend has two parallel auth systems:
- FastAPI JWT — `localStorage.access_token` + `user` JSON. Used by `src/services/api.ts`, `src/utils/messagingAPI.ts`, `src/utils/coursesAPI.ts`, and similar.
- Supabase auth — `campuspandit-auth-storage` localStorage key. Used by question-bank operations.

Public routes (`/`, `/for-students`) are static and have **zero** backend dependency. The Founding 10 CTA is a `mailto:` link. All other routes are protected and require FastAPI auth.

## 4. Target end-state during observe window

- **Live:** Azure Static Web App serving:
  - `/` (B2B landing — Log in nav link removed, "Apply for pilot" CTAs route to `/apply`, copy softened on Branded App and Center Dashboard claims)
  - `/for-students` (student landing — all 9 `/auth` CTAs replaced with `mailto:` waitlist links framed as **"Tell us about your coaching center"**, not "Sign up")
  - `/blog`, `/blog/:slug` (content marketing, static markdown, audience-tagged with `coaching_center | prospective_cc_via_student | both`)
  - `/materials` (study resources card grid, student-primary, links to NCERT/OpenStax/PYQ PDFs)
  - `/roadmap` (Now/Next/Later transparency view, placeholder items at launch, finalized after engagement data)
  - `/ideas` (feature-request form + published-ideas list with upvote buttons — upvote requires auth; submit and read are anonymous)
  - `/apply` (Founding 10 application form, backed by `pilot_applications` table)
  - `/apply/thanks` (confirmation page — Plausible conversion goal)
- **Parked (Stage 1):** `/auth` and every legacy protected route redirect to `/` via `<Navigate to="/" replace />`. No login form, no consumer app. **This state holds through Stage 1 (~weeks 1–4).**
- **Conditional Stage 2 (~weeks 5–12 if triggered):** magic-link auth UI ships at `/auth`. Visitors can sign in to upvote ideas or join the waitlist. The legacy consumer app routes (`/coach`, `/messages`, `/crm`, etc.) **remain redirected to `/`** even in Stage 2 — Stage 2 only opens the upvote + waitlist surface, not the parked consumer app.
- **Cold:** Azure Container App scaled to min/max-replicas=0 (image retained in ACR). Azure Postgres Flexible Server **deleted** after `pg_dump` snapshot is verified in Blob storage (avoids the 7-day auto-resume cycle problem over 12 weeks).
- **Data home:** New Supabase project provisioned and seeded with full Azure Postgres restore, plus four observe-window tables (`feature_requests`, `feature_request_votes`, `engagement_signals`, `pilot_applications`). Existing question-bank Supabase project untouched.
- **Cost target:** ~$5–25/mo total (Static Web App + ACR Basic + Log Analytics minimum + Plausible $9/mo). Supabase free tier covers the new project.

## 5. Implementation phases (observe window)

Phase numbering deliberately starts at 0 so it matches the runbook in §8.

### Phase 0 — Pre-flight (~1h)

- Grep `src/components/LandingPage.tsx` and `src/components/LandingPageStudent.tsx` for any import that transitively reaches `src/services/api.ts`, `src/utils/messagingAPI.ts`, `src/hooks/useSSE.ts`, or any URL pointing at the Container App. Expect zero matches. If any appear, fix before Phase 2.
- Inventory Azure Postgres:
  - `SELECT pg_size_pretty(pg_database_size(current_database()));`
  - Table list with row counts.
  - `SELECT extname, extversion FROM pg_extension;`
- Provision a new Supabase project (free tier, region matching Azure for migration speed). Record `SUPABASE_URL`, `anon` key, `service_role` key in a secrets vault (1Password, Bitwarden, etc.) — not committed to git.
- Confirm or create an Azure Blob Storage container `db-backups` with private access.

### Phase 1 — Backup and data migration (~2–4h, depends on data volume)

- Backup Azure Postgres:
  ```
  pg_dump -Fc --no-owner --no-acl \
    "postgresql://dbadmin:PASSWORD@campuspandit-db.postgres.database.azure.com:5432/campuspandit?sslmode=require" \
    -f campuspandit-2026-05-22.dump
  ```
- Upload dump to `db-backups` blob container. Set 30-day lifecycle to archive tier, 365-day to delete.
- Restore schema to new Supabase project:
  ```
  pg_restore --schema-only --no-owner --no-acl \
    -d "postgresql://postgres:PASSWORD@db.NEW_PROJECT.supabase.co:5432/postgres" \
    campuspandit-2026-05-22.dump
  ```
- Fix anything Supabase-specific that errors:
  - Drop or rewrite any objects in reserved schemas (`auth.*`, `storage.*`, `realtime.*`).
  - Skip RLS policy creation for now (out-of-scope until restart).
  - Re-create extensions if `pg_restore` skipped them (`uuid-ossp` is usually pre-installed).
- Restore data:
  ```
  pg_restore --data-only --no-owner --no-acl --disable-triggers \
    -d "postgresql://postgres:PASSWORD@db.NEW_PROJECT.supabase.co:5432/postgres" \
    campuspandit-2026-05-22.dump
  ```
- Verify:
  - Row counts per table match source.
  - Spot-check three rows: one user, one course, one channel_message. JSON columns and timestamps round-trip cleanly.

**Provision admin tables on the new Supabase project (~45 min)** — four tables that back the new observe-window infrastructure, separate from the restored Azure data:

```sql
-- Ideas / Feature Request submissions (consumer page in Phase 3d)
CREATE TABLE feature_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  description text CHECK (char_length(description) <= 2000),
  audience text NOT NULL CHECK (audience IN ('coaching_center', 'student', 'either')),
  submitter_email text,
  upvotes int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY ideas_insert_any ON feature_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY ideas_select_published ON feature_requests FOR SELECT TO anon, authenticated USING (is_published = true);

-- Engagement signals from LinkedIn / Twitter posts (manual logging, Phase 3g)
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
-- No anonymous policies — admin-only via Supabase dashboard or service_role key.

-- Founding 10 application form submissions (consumer page in Phase 3h)
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
  icp_fit_score int CHECK (icp_fit_score BETWEEN 0 AND 10),     -- populated post-review
  icp_fit_notes text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewed','accepted','rejected','withdrawn')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pilot_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY apps_insert_any ON pilot_applications FOR INSERT TO anon, authenticated WITH CHECK (true);
-- No public SELECT — applications are sensitive. Read via Supabase Studio / service_role key only.

-- Upvotes on feature_requests (conditional Stage 2 — see Phase 3.5)
-- Schema ships in Phase 1 so it's ready when Stage 2 fires; the upvote UI doesn't ship until Phase 3.5.
CREATE TABLE feature_request_votes (
  feature_request_id uuid NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,                                          -- references auth.users(id) once magic-link auth is live
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

### Phase 2 — Park the consumer app and strip auth surface (~1–2h)

Goal: from a visitor's perspective, the site is pure landing/billboard. No mention of login, signup, or "pilot in setup" anywhere visible.

1. Edit `src/components/LandingPage.tsx`:
   - Remove the "Log in" link from desktop nav (~line 47).
   - Remove the "Log in" link from mobile menu (~line 75).
   - Change every "Apply for pilot" CTA from `href="#apply"` (in-page anchor) to `href="/apply"` (Pilot Application form route — ships in Phase 3h). The in-page `<section id="apply">` is kept as a "what happens next" recap, but its primary button now also routes to `/apply`. The legacy `mailto:` link inside that section is removed.
   - Update any remaining `founders@campuspandit.com` references to `founders@campuspandit.ai`.
2. Edit `src/components/LandingPageStudent.tsx`:
   - Replace every `href="/auth"` (9 occurrences across nav, hero, mid-page CTAs, and footer) with the meta-lead-gen `mailto:` framing (per `CONTEXT.md` → `/for-students` resolution): `href="mailto:founders@campuspandit.ai?subject=Tell%20us%20about%20your%20coaching%20center&body=I%20study%20at%20a%20coaching%20center%20that%20might%20benefit%20from%20CampusPandit.%0A%0ACoaching%20center%20name%3A%0ALocation%3A%0AWebsite%2FInstagram%3A%0A"`.
   - In-page CTA copy where applicable: replace "Start learning free" / "Sign up" with **"Tell your coaching center about CampusPandit"**.
   - Verify after edit: `grep '/auth' src/components/LandingPageStudent.tsx` returns no matches, and `grep 'campuspandit\.com' src/components/LandingPageStudent.tsx` returns no matches.
3. Edit `src/App.tsx`:
   - Define a small helper at the top of `AppRoutes`: `const ParkedRoute = () => <Navigate to="/" replace />;`.
   - Replace the `/auth` route element with `<ParkedRoute />`.
   - For every protected route, replace `<Navigate to="/auth" />` and the protected component with `<ParkedRoute />`. The lazy imports for protected components can stay in the file — unused imports do not affect the bundle once tree-shaking runs.
   - Keep `/` (`LandingPage`) and `/for-students` (`LandingPageStudent`) exactly as-is.
4. Optional defensive change: short-circuit `src/hooks/useSSE.ts` `connect()` when `import.meta.env.VITE_CONSUMER_APP_PARKED === 'true'`. Defense-in-depth — no user-facing effect once routes are parked, but prevents EventSource noise if something is ever rendered by mistake.
5. Deploy via existing Azure Static Web Apps workflow.
6. Smoke test in incognito:
   - `/` renders fully, no "Log in" visible anywhere.
   - `/for-students` renders fully, every CTA opens a `mailto:` draft to `founders@campuspandit.ai`.
   - `/auth`, `/coach`, `/messages`, `/crm`, `/courses` — all silently redirect to `/`.
   - Founding 10 application mailto opens correctly.

### Phase 3 — Content sections: Blog, Preparation Materials, Roadmap, Ideas (~2.75d)

Goal: thicken the landing surface from a single Founding 10 page into a content layer that gives visitors reasons to engage and gives the observe window a real signal to measure. All four sections are publicly accessible, no auth, indexable by search engines.

**Routing setup (~0.25d)**
- Add public routes to `src/App.tsx` (before the fallback `*` route): `/blog`, `/blog/:slug`, `/materials`, `/roadmap`, `/ideas`, `/apply`, `/apply/thanks`. None wrapped in auth during Stage 1.
- Phase 3.5 adds (conditionally) `/auth` (replacing the `ParkedRoute` redirect), `/auth/callback`, and `/welcome` — only ship these if Stage 1 trips its thresholds.
- Decide on shared nav: simplest is to inline the existing `LandingPage.tsx` nav markup into each new page initially; extract a `<PublicNav />` component only if churn justifies it during build.

**Sub-step 3a: Blog (~0.5d + ongoing content)**
- Use plain markdown via existing `react-markdown` (already in deps) — defer MDX unless rich embeds are needed.
- Directory: `src/content/blog/*.md`. Per-file frontmatter: `title`, `date`, `slug`, `audience` (`b2b | student`), `excerpt`, `seo_description`.
- Components: `src/components/Blog.tsx` (listing with audience tag filter), `src/components/BlogPost.tsx` (individual post + meta tags).
- SEO per post: `<title>`, `<meta name="description">`, `<meta property="og:title|og:description|og:image">`, canonical URL.
- Add `/blog` and each `/blog/:slug` to the prerender pipeline (see `scripts/prerender.js`).
- Seed posts (content authored by Sreekanth, not generated by the implementation plan):
  - `running-a-coaching-center-like-a-saas` (audience: `b2b`) — intent: the case for treating a coaching center like a software product, from someone building the platform.
  - `jee-prep-the-honest-version` (audience: `student`) — intent: what actually matters in JEE prep, cutting through coaching-chain marketing.
  The implementation plan should treat the two markdown files as "placeholder until Sreekanth's content lands" — render correctly with lorem-ipsum body if the real text is not ready by deploy.

**Sub-step 3b: Preparation Materials (~0.5d + curation)**
- `src/components/PreparationMaterials.tsx` — card grid, grouped by subject (Physics, Chemistry, Math, Biology).
- Content config: `src/data/materials.ts` — array of `{ category, title, description, url, type: 'pdf' | 'external', subject }`.
- Initial seed (~12–20 entries): NCERT chapter links (official), OpenStax (already integrated in codebase), 2–3 sample PYQ collections hosted in `public/materials/`. Avoid copyrighted material from coaching chains.
- Audience: student-primary. Visible from `/for-students` nav. Indexable from `/` but not nav-promoted there.

**Sub-step 3c: Roadmap (~0.5d code + content deferred to post-engagement)**
- `src/components/Roadmap.tsx` — three columns "Now · Next · Later".
- Content config: `src/data/roadmap.ts` — array of `{ title, description, column: 'now' | 'next' | 'later', audience: 'b2b' | 'student' | 'both' }`.
- Public transparency play — show coaching-center owners and students what is being built, mark items with audience badges so each segment can spot what matters to them.
- **Initial content is intentionally light** — ship Phase 3c with 2–3 placeholder items that are already certain (e.g., "Founding 10 pilot launch — Now", "Branded student app — Next"). Final roadmap content is written **after** the first week of engagement signals from LinkedIn and Twitter posts (see Phase 3g). Rationale: roadmap items reflect what the market actually pulls on, not what we guess they want. Updating `src/data/roadmap.ts` is a 5-minute commit — no code re-deploy concerns.
- Treat the file `src/data/roadmap.ts` itself as the deliverable. Add a top-of-file comment: `// Final items written after engagement signals — see docs/superpowers/specs/2026-05-22-park-consumer-app-supabase-migration-design.md §5 Phase 3g`.

**Sub-step 3d: Ideas / Feature Request (~1d)**
- Schemas and RLS already provisioned in Phase 1 (`feature_requests` and `feature_request_votes` tables on new Supabase project).
- `src/components/Ideas.tsx`:
  - Form: title (required), description (optional), audience (radio with values `coaching_center | prospective_cc_via_student | both`), email (optional). Submit via `supabase.from('feature_requests').insert(...)` using the new project's anon key.
  - List below the form: most-recent 10 published ideas. Pulled via `supabase.from('feature_requests').select('*, vote_count:feature_request_votes(count)').eq('is_published', true).order('created_at', { ascending: false }).limit(10)`.
  - Each published idea card shows: title, description, audience badge, **upvote count** (e.g., "↑ 12"). The upvote button itself is rendered but **disabled with `aria-disabled="true"` and a tooltip "Sign in to upvote (coming soon)" during Stage 1.** When Stage 2 ships (Phase 3.5), the button becomes enabled and wired to `supabase.from('feature_request_votes').insert(...)` — see Phase 3.5 for the auth-gated upvote handler.
- New env vars in Static Web App config: `VITE_IDEAS_SUPABASE_URL`, `VITE_IDEAS_SUPABASE_ANON_KEY` (separate from question-bank ones so the projects do not get conflated).
- Spam mitigation v1: manual `is_published` flip in Supabase dashboard. v2 (if volume warrants): Cloudflare Turnstile widget in front of submit.

**Sub-step 3e: Nav updates**
- `LandingPage.tsx`: add `Blog · Roadmap · Ideas` to desktop and mobile nav. Do not add Materials (B2B audience does not need it nav-promoted). The existing "Apply for pilot" button in the right-side nav stays — it now routes to `/apply` (per Phase 2).
- `LandingPageStudent.tsx`: add `Blog · Materials · Roadmap · Ideas` to desktop and mobile nav.
- `/apply`, `/apply/thanks`, `/blog/:slug`, and all other new public routes inherit a shared nav by copying the LandingPage nav markup at the top of each component (DRY refactor to a `<PublicNav />` component is a future cleanup, not in observe scope).

**Sub-step 3f: SEO and indexing**
- Verify `public/robots.txt` allows `/blog/*`, `/materials`, `/roadmap`, `/ideas`.
- Update sitemap generator (or `vite.config.ts` prerender list) to include all new routes including individual blog slugs.
- Submit updated sitemap via Google Search Console after deploy.
- Each new page: unique `<title>` and `<meta name="description">`.

**Sub-step 3g: Engagement signal capture and saved queries (~0.5h setup + ongoing manual entry)**

The observe-window signal we actually care about — does the content + landing combination get attention? This sub-step is the lightweight infrastructure to answer that question instead of relying on gut-feel.

*Capture workflow (manual):*
- Schema lives in Phase 1 (`engagement_signals` table on new Supabase project).
- After each LinkedIn or Twitter post, open Supabase Studio → Table Editor → `engagement_signals` → Insert row. Fill in `platform`, `post_url`, `post_topic`, `posted_at`, and leave metric columns null initially.
- Re-open the row 24h, 72h, and 7d after posting; update `impressions`, `likes`, `comments`, `shares`, `link_clicks`, `profile_visits` from the platform's native analytics.
- Use `post_topic` consistently so cross-post comparisons work — suggested seed values: `b2b-pitch`, `roadmap-launch`, `blog-share-b2b`, `blog-share-student`, `materials-share`, `founder-story`.
- `link_clicks` is the highest-value column — it counts visitors who actually came to `www.campuspandit.ai`. UTM the post URLs (`?utm_source=linkedin&utm_medium=social&utm_campaign=<post_topic>`) so the count is verifiable against Search Console / GA.

*Saved queries* — store at `docs/superpowers/queries/engagement-signals.sql` so they are version-controlled and re-runnable. Initial set:

```sql
-- Q1: 7-day rollup per platform
SELECT platform,
       count(*)                  AS posts,
       sum(impressions)          AS impressions,
       sum(likes)                AS likes,
       sum(comments)             AS comments,
       sum(shares)               AS shares,
       sum(link_clicks)          AS clicks
FROM engagement_signals
WHERE posted_at > now() - interval '7 days'
GROUP BY platform
ORDER BY clicks DESC NULLS LAST;

-- Q2: top posts by qualitative engagement (comments + shares is a better
-- signal than likes, which decay toward platform noise)
SELECT post_topic, platform, post_url,
       impressions, likes, comments, shares, link_clicks
FROM engagement_signals
ORDER BY (coalesce(comments, 0) + coalesce(shares, 0)) DESC
LIMIT 10;

-- Q3: topic resonance — which themes pull clicks per impression
SELECT post_topic,
       count(*)                                                    AS posts,
       avg(likes)::int                                             AS avg_likes,
       avg(comments)::int                                          AS avg_comments,
       avg(link_clicks)::int                                       AS avg_clicks,
       round(avg(link_clicks::numeric / nullif(impressions, 0)), 4) AS ctr
FROM engagement_signals
WHERE post_topic IS NOT NULL
GROUP BY post_topic
ORDER BY ctr DESC NULLS LAST;

-- Q4: daily click trend to www.campuspandit.ai (proxy for observe-window heartbeat)
SELECT date_trunc('day', posted_at)::date AS day,
       sum(link_clicks)                   AS clicks,
       count(*)                           AS posts_that_day
FROM engagement_signals
GROUP BY day
ORDER BY day DESC;

-- Q5: cross-reference with feature_requests submitted in the same window
-- (does engagement correlate with ideas submissions?)
SELECT date_trunc('day', es.posted_at)::date AS day,
       sum(es.link_clicks)                   AS clicks,
       count(fr.id)                          AS ideas_submitted
FROM engagement_signals es
LEFT JOIN feature_requests fr
       ON date_trunc('day', fr.created_at) = date_trunc('day', es.posted_at)
GROUP BY day
ORDER BY day DESC;

-- Q6: Founding 10 application funnel — the primary B2B conversion signal
-- Counts new vs. reviewed vs. accepted, by week. Drives the kill/keep verdict.
SELECT date_trunc('week', created_at)::date AS week,
       count(*)                              AS total_applications,
       count(*) FILTER (WHERE status = 'new')       AS pending_review,
       count(*) FILTER (WHERE status = 'reviewed')  AS reviewed_no_decision,
       count(*) FILTER (WHERE status = 'accepted')  AS accepted,
       count(*) FILTER (WHERE status = 'rejected')  AS rejected,
       count(*) FILTER (WHERE icp_fit_score >= 7)   AS icp_fit_high,
       avg(icp_fit_score)::numeric(3,1)             AS avg_icp_score
FROM pilot_applications
GROUP BY week
ORDER BY week DESC;
```

*Where this feeds back:*
- Run Q1–Q6 weekly during the observe window.
- After ~2 weeks of data, use Q3 (topic resonance) and the published `feature_requests` rows to finalize `src/data/roadmap.ts` content (the items go from placeholder to real, per Phase 3c).
- At end of Stage 1 (~week 4), Q1–Q5 plus the Plausible dashboard determine whether Stage 2 triggers (see Phase 3.5).
- At end of observe window (~2026-08-21), Q6 plus the Plausible dashboard inform the kill/keep decision.

**Sub-step 3h: Pilot Application form (~0.5d)**
- Schema (`pilot_applications`) and RLS already provisioned in Phase 1.
- New routes added in 3.1: `/apply` (form) and `/apply/thanks` (confirmation, Plausible conversion goal).
- `src/components/PilotApplication.tsx`:
  - Form fields (all `required` except where noted): center_name, owner_name, location, students_count (number 1–100000), subjects_taught (multi-select chips from preset list: Physics, Chemistry, Math, Biology, JEE Combined, NEET Combined, Other), current_software (text, optional), website_or_instagram (text, optional), contact_email (email validated client-side and server-side via the table CHECK), contact_phone (text, optional), message (textarea up to 4000 chars, optional).
  - Submit via `supabase.from('pilot_applications').insert(...)` using the new project's anon key.
  - On success: route to `/apply/thanks` and trigger Plausible custom event `pilot_application_submitted` for funnel measurement.
- `src/components/PilotApplicationThanks.tsx`:
  - Confirmation copy: "Thanks — we'll review within 48 hours and reach out to schedule a 20-minute call."
  - Secondary CTA: link to `/roadmap` so visitors stay on-site after submitting.
- Notification: Supabase database webhook OR a daily `SELECT * FROM pilot_applications WHERE created_at > now() - interval '24 hours'` query run via Supabase Studio. Decision: start with manual daily check; build webhook only if volume justifies it.
- Spam mitigation v1: same as Ideas — manual review via Supabase Studio with `status = 'new'` rows. Move to `reviewed`/`accepted`/`rejected` as decisions are made.
- The legacy `mailto:` link in `LandingPage.tsx`'s `#apply` section is removed (per Phase 2). All "Apply for pilot" buttons now route to `/apply`.

**Sub-step 3i: Landing-copy softening (~0.5h)**
Before the first LinkedIn or Twitter post goes out, soften the claims on `LandingPage.tsx` that the codebase cannot currently deliver. These changes are surgical — keep the conversion hooks intact but stop over-promising.

| Existing copy (location) | Updated copy |
|---|---|
| Hero: "Pilot setup in 7 days" | (unchanged — the *setup* in 7 days is honest; deliverable is Branded PWA) |
| Pillar 1: "Branded app published in 7 days" / "Published to Play Store under your brand" | "Branded student web app in 7 days · native Play Store app in pilot month 2–3" |
| Pricing card "Founding 10" stat: "Branded app published in 7 days" | "Branded student web app published in 7 days" |
| Pillar 3: "Weekly 'at-risk students' report for the owner" | "Weekly 'at-risk students' report — rolling out in pilot month 2" |
| Pillar 3: "Tutor performance, session attendance, and earnings" | "Tutor performance roll-ups — rolling out in pilot month 2" |

Do **not** soften AI Coach copy — per `CONTEXT.md`, the AI Coach is real (lives in the parked FastAPI backend) and will be unparked on Founding 10 delivery. PYQ-weighted diagnosis is a legitimate claim once the backend is restored.

**Sub-step 3j: Plausible Analytics integration (~0.5h)**
Stage 1 measurement infrastructure. Without this, the engagement thresholds in Phase 3.5 are not computable.

1. Sign up for Plausible Analytics at $9/mo Starter plan. Add the property `campuspandit.ai`.
2. Add the Plausible script to `index.html` under `<head>`:
   ```html
   <script defer data-domain="campuspandit.ai" src="https://plausible.io/js/script.outbound-links.tagged-events.js"></script>
   ```
   The `outbound-links.tagged-events` variant tracks `mailto:` clicks (for the `/for-students` waitlist) and supports custom events.
3. Configure goals in the Plausible dashboard:
   - `pilot_application_submitted` (custom event — fired by `PilotApplication.tsx` on successful submit)
   - `feature_request_submitted` (custom event — fired by `Ideas.tsx` on successful submit)
   - `/apply/thanks` (page-view goal — backup verification of the application funnel)
   - `Outbound Link: Mail` (auto-tracked — measures `/for-students` waitlist intent)
4. UTM convention for every social post link to the site:
   `https://www.campuspandit.ai/<path>?utm_source=linkedin|twitter&utm_medium=social&utm_campaign=<post_topic>`
   This must match the `post_topic` values used in `engagement_signals` (Phase 3g) for cross-table joins to work.
5. Stage 1 thresholds (visible on the Plausible dashboard, no SQL needed):
   - Unique visitors / week (UTM-traceable) ≥ 100
   - Median session duration ≥ 45 sec
   - Pages per session ≥ 1.8
   - Scroll depth on `/` reaching the pricing section ≥ 60% of sessions
   - `/ideas` form submissions ≥ 3 distinct submitters
6. Stage 1 → Stage 2 trigger rule: **≥4 of 5 thresholds met by end of week 4.** Document this rule in `docs/superpowers/queries/stage-gates.md` so the verdict is not retroactively redefined.

### Phase 3.5 — Stage 2 magic-link rollout (CONDITIONAL, ~0.75d, fires only if Stage 1 trips)

This sub-phase **does not run automatically.** At end of week 4, the operator (Sreekanth) reviews the Plausible dashboard against the Phase 3j thresholds. If ≥4 of 5 are met, Phase 3.5 is implemented. If not, the experiment concludes at the end of Stage 1.

Goal of Phase 3.5: test whether engaged visitors will *convert* — sign in via magic-link to either join a passive waitlist or actively upvote a `/ideas` entry.

**Auth UI:**
1. Create `src/components/MagicLinkAuth.tsx` mounted at `/auth` (replacing the `<ParkedRoute />` redirect from Phase 2 — only for `/auth`, not for the other legacy protected routes, which stay parked).
   - Single email input + "Send me a sign-in link" button.
   - Submit calls:
     ```ts
     await supabase.auth.signInWithOtp({
       email,
       options: { emailRedirectTo: 'https://www.campuspandit.ai/auth/callback' }
     });
     ```
   - Uses the same Supabase client that already owns the new observe-window project — `auth.users` lives there.
2. Create `src/components/AuthCallback.tsx` mounted at `/auth/callback`:
   - On mount, call `supabase.auth.getSession()` to complete the OTP exchange.
   - On success, route to `/welcome` (see below).
   - On error (expired link, malformed token): inline message "Sign-in link expired — request a new one" with a button back to `/auth`.
3. Create `src/components/Welcome.tsx` mounted at `/welcome`:
   - Headline: "You're in. Here's what you can do."
   - Two CTAs side-by-side: "Browse the roadmap" (→ `/roadmap`) and "See community ideas" (→ `/ideas`).
   - Fires Plausible custom event `magic_link_converted` once per session.

**Upvote wiring on `/ideas`:**
- Update `src/components/Ideas.tsx` to detect auth state via `supabase.auth.getUser()`.
- If user is authenticated: upvote button becomes enabled. Click handler:
  ```ts
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase
    .from('feature_request_votes')
    .insert({ feature_request_id, user_id: user.id });
  // The (feature_request_id, user_id) UNIQUE PK makes this idempotent — trap the
  // duplicate-key error and treat as success (the user already voted).
  ```
- If user is anonymous: upvote button stays disabled with tooltip "Sign in to upvote" — clicking the tooltip CTA opens `/auth`.
- After successful upvote: optimistic count update (no re-fetch), fire Plausible custom event `idea_upvoted`.

**Stage 2 threshold (the kill/keep verdict input):**
- ≥10% of unique visitors during Stage 2 weeks convert (defined as: visitor triggered either `magic_link_converted` or `idea_upvoted` Plausible event).
- Stage 2 runs for the remaining ~8 weeks of the observe window (~2026-06-19 → 2026-08-21).

**Smoke test before declaring Stage 2 live:**
- Send a magic link to your own personal Gmail. Click it. Confirm the redirect to `/auth/callback` → `/welcome` works end-to-end.
- From the same logged-in session, upvote an idea. Confirm the row lands in `feature_request_votes` and the count updates.

### Phase 4 — Shut down Azure compute and DB (~30 min)

- Container App: `az containerapp update --name campuspandit-backend-prod --resource-group campuspandit-rg-prod --min-replicas 0 --max-replicas 0`. Verify with `az containerapp revision list` that no replicas are running. Image remains in ACR.
- Azure Postgres: **delete** the Flexible Server (not just stop) after the Phase 1 `pg_dump` snapshot has been verified in Blob storage. Rationale: with a 3-month observe window, Azure's 7-day auto-resume on stopped B-tier servers would require ~12 manual re-stop cycles, each at risk of being forgotten (~$0.50/day cost bleed per missed cycle). The Blob snapshot is the canonical recovery point; the server itself is redundant.
  - Verify snapshot integrity first: `az storage blob show ... --container-name db-backups --blob-name campuspandit-2026-05-22.dump --query 'properties.contentLength'` returns the expected byte size, and a test `pg_restore --list campuspandit-2026-05-22.dump` enumerates tables.
  - Then: `az postgres flexible-server delete --name campuspandit-db --resource-group campuspandit-rg-prod --yes`. Resource ID gone, no further bills.
- ACR: leave on Basic tier (~$5/mo). Do not delete repositories — the parked Container App image is the fast-path restore.
- Set Azure cost alert at $20/mo (Subscription → Cost Management → Budgets) so any forgotten resource pings via email.

### Phase 5 — Verify and document (~1h)

- Cost screenshot from Azure Cost Management, dated 2026-05-22, saved to `docs/superpowers/specs/2026-05-22-cost-before.png`. Repeat in 7 days as `cost-after-7d.png`.
- Update `README.md` with a short "Pilot status" note pointing to this spec.
- Add a project-memory entry recording that the park has been executed and where the snapshot lives.

## 6. Restart-path design (implementation deferred)

This section documents the architecture to use **if** the observe verdict is "keep going." It is not implementation-ready code; it is the decisions made now so the restart is not blocked on re-derivation.

### 6.1. Auth on restart: extending magic-link to the unparked consumer app

The magic-link auth UI (`MagicLinkAuth`, `AuthCallback`, `Welcome`) already ships as part of Phase 3.5 **if** Stage 1 trips. So at the moment of the kill/keep verdict, the situation is one of these two:

| State at end of observe | Frontend has | Backend has |
|---|---|---|
| Stage 2 ran | Magic-link auth UI live at `/auth`, `auth.users` table populated with observe-period signups | Parked Container App + deleted Postgres + Blob snapshot |
| Stage 2 did **not** run (Stage 1 failed) | No auth UI shipped during observe — `/auth` still redirects to `/` | Same as above |

**The cascade nobody mentions until it bites:** every authenticated API call in the *legacy consumer app* (`messagingAPI.ts`, `coursesAPI.ts`, `tutoringAPI.ts`, `crmAPI.ts`, video uploads, payment history) reads `localStorage.access_token`, which today is a FastAPI-issued JWT. The Phase 3.5 magic-link auth issues a *Supabase* JWT instead. These are not compatible.

On restart, the choice is:

- **Option A (recommended): keep magic-link as the only auth; rewrite the legacy API modules to Supabase calls.** Effort: 5.5–8 days (see §6.5, §6.6). End state: one auth system, clean.
- **Option B: dual-stack auth.** FastAPI JWT for legacy modules, Supabase magic-link for `/ideas` + `/welcome` + future features. Effort: 0.5 day (just enable both auth contexts). End state: ugly, both auth systems persist indefinitely.
- **Option C: don't restart the legacy consumer app at all.** The B2B pivot has explicitly moved away from direct-to-student. Keep observe-window content + Stage 2 features as the new product; the parked consumer app stays parked permanently. Effort: 0 days for auth. The user-backfill question never arises.

If Stage 2 did not run, option A is the only honest one for any restart — there is no magic-link UI to dual-stack with yet.

**Concrete work for Option A on restart (only if observe → "keep" and Stage 2 ran):**
- Rewrite `src/contexts/AuthContext.tsx` to derive session from `supabase.auth.onAuthStateChange` rather than localStorage polling. Remove all reads of the legacy `access_token` key.
- Every module that reads `localStorage.getItem('access_token')` switches to either:
  - direct Supabase calls (read/write via `supabase.from(...)`) — preferred where RLS can express the access rules, or
  - calls to Supabase Edge Functions that re-implement business logic, with the user's Supabase JWT auto-attached.
- User backfill from the restored Azure Postgres `users` data:
  - Restore Blob snapshot to the new Supabase project (a `legacy_users` schema or staging table to avoid colliding with `auth.users`).
  - Bulk-import emails into `auth.users` via the Supabase admin API. Supabase supports passwordless accounts natively — no password hash needed.
  - Pre-loading (rather than letting `signInWithOtp` create the row on first use) is preferred because it preserves the `users.id` → linked-tables relationship — the existing `user_id` foreign keys across `channels`, `channel_messages`, `courses`, etc. keep pointing at the same UUID.
  - Bulk-import script lives in `scripts/restart/import-users-to-supabase-auth.ts`, run once.
- Supabase Auth email template: configure subject, body, and sender (`founders@campuspandit.ai`) in the Supabase dashboard. If Google Workspace SMTP is configured, use it; otherwise accept Supabase's default sender during early restart and migrate to SMTP after.
- Rate limiting: Supabase Auth's default (4/hour per email) is fine.

**Why passwordless magic-link was the right choice (locked in 2026-05-22):**
- No password storage liability.
- No password-reset flow to build.
- No user-import-with-hashed-passwords compatibility hassle.
- ~1 full day saved on the restart estimate vs. the original password design.

**Drawback already covered in Phase 3.5:** email deliverability is a hard dependency. The Phase 3.5 smoke test against Gmail validates this before Stage 2 opens to real users.

### 6.2. SSE → Supabase Realtime mapping

Current SSE event types and their Supabase Realtime equivalents:

| Current SSE event | Supabase Realtime mechanism |
|---|---|
| `new_message` | `postgres_changes` INSERT on `channel_messages` |
| `message_updated` | `postgres_changes` UPDATE on `channel_messages` |
| `message_deleted` | `postgres_changes` DELETE (or UPDATE with `is_deleted=true`) on `channel_messages` |
| `message_reaction` | `postgres_changes` INSERT on `message_reactions` |
| `reaction_removed` | `postgres_changes` DELETE on `message_reactions` |
| `typing` | Realtime `broadcast` channel (transient, not persisted) |
| `presence` | Realtime `presence` feature |
| `read_receipt` | `postgres_changes` UPDATE on `channel_members.last_read_at` |
| `connection` | Replaced by Supabase Realtime's built-in connection lifecycle |

`src/hooks/useSSE.ts` is rewritten as `src/hooks/useRealtime.ts` exporting the same callback-prop API (`onNewMessage`, `onTyping`, `onPresence`, etc.) so consumers (currently only `MessagingApp.tsx`) need minimal change. The new hook subscribes per-channel via `supabase.channel('channel:' + channelId)` and combines `postgres_changes`, `broadcast`, and `presence` listeners on that channel.

### 6.3. RLS policies (messaging tables)

Minimum policy set to ship messaging on Supabase:

- `channels`: SELECT allowed if the requesting user is in `channel_members` for that `channel_id` and `is_private` is false, or the user is a member of a private channel. INSERT allowed for any authenticated user. UPDATE/DELETE for owner/admin role only.
- `channel_members`: SELECT for own rows and for rows in channels the user is a member of. INSERT controlled by channel role.
- `channel_messages`: SELECT/INSERT scoped to `channel_id` the user is a member of. UPDATE/DELETE only on own messages.
- `message_reactions`: SELECT/INSERT/DELETE scoped to messages in channels the user is a member of.

Full policy SQL drafted at restart time. Use Supabase CLI migrations so they live in version control.

### 6.4. Realtime publication

Enable `supabase_realtime` publication for `channel_messages`, `message_reactions`, and `channel_members` (for `last_read_at` updates). Done via Supabase dashboard or `ALTER PUBLICATION supabase_realtime ADD TABLE ...`.

### 6.5. messagingAPI rewrite

`src/utils/messagingAPI.ts` — every `apiRequest(...)` call becomes a `supabase.from(...).insert/update/select/delete()` call. Type definitions for `Channel`, `Message`, `ChannelMember`, `MessageReaction` stay; only the data-access functions change. Estimated 1–2 days of focused work once RLS is in place.

### 6.6. coursesAPI, tutoringAPI, crmAPI, etc.

Same pattern as messagingAPI: replace HTTP-to-FastAPI with direct Supabase calls. If any module has genuine server-side business logic (e.g., payment webhook handling, video transcoding triggers), move that logic to Supabase Edge Functions or Vercel/Cloudflare Workers — whichever is cheapest and matches the latency profile.

### 6.7. Estimated restart effort

Assumes Option A from §6.1 (single auth system on Supabase). If Stage 2 ran during observe, the auth-UI / backfill scaffolding is already in place — restart only needs the user import and module migration.

| Block | Stage 2 ran | Stage 2 did NOT run |
|---|---|---|
| User backfill from Blob snapshot (§6.1) | 0.25–0.5 | 0.25–0.5 |
| Magic-link auth UI + AuthContext rewire (§6.1) | 0 (already in Phase 3.5) | 0.5–1 |
| messagingAPI + RLS + Realtime hook (§6.2, §6.3, §6.5) | 1.5–2 | 1.5–2 |
| coursesAPI, tutoringAPI, crmAPI rewrites (§6.6) | 2–3 | 2–3 |
| Edge functions for any non-CRUD logic | 1–2 | 1–2 |
| Frontend env config + deploy + smoke tests | 0.5 | 0.5 |
| **Total** | **5.25–8 focused days** | **5.75–9 focused days** |

This is the budget the restart decision should be evaluated against. If the observe signal does not justify ~1.5 weeks of focused work, the answer is "kill."

**Also note Option C from §6.1** (don't restart the legacy consumer app at all) — zero days. This is the right answer if observe → "keep" and the verdict signal is coming from B2B applications + ideas + Stage 2 conversion, not from any latent demand for the parked student app.

## 7. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Active user mid-session is locked out by the park | Accepted — the "Nothing — only B2B landing matters" decision in §2. `/auth` and protected routes redirect to `/` silently. Data is intact in Supabase, so a future restart is non-destructive. |
| `pg_dump` misses extensions, sequences, or system data | The Blob snapshot is the canonical recovery point. Per Phase 4, verify snapshot integrity (size + `pg_restore --list` enumerates tables) BEFORE deleting the Flexible Server. Snapshot retention: 365 days. |
| Supabase free tier limits (500 MB DB, pauses on 1-week inactivity) | Free tier auto-resumes on next query. If the Phase 0 `pg_database_size` query shows > 400 MB (buffer for growth), provision Supabase Pro ($25/mo) from the start instead of free — still net positive vs. Azure. |
| Frontend tries to call dead Container App endpoints anyway | Parked routes prevent protected components from mounting. Defensive `useSSE` short-circuit covers the edge case. Worst case is console errors, not user-facing failure. |
| Constant Contact sync drift (forgot to export weekly) | Add a recurring weekly calendar reminder ("export Supabase → CC list"). The workflow doc at `docs/superpowers/queries/constant-contact-sync.md` is the single source of truth for the manual process. Drift cost is delayed nurture, not lost data — applications stay in `pilot_applications` regardless. |
| Plausible script triggers EU cookie banner or ad-blockers | Plausible is cookieless and GDPR-compliant by default — no banner needed. Some hardcore ad-blockers (uBlock Origin with Annoyances filter) still block it; that's a fixed undercount risk (~5–10% of tech-savvy visitors). Accept; cross-verify trends against Search Console. |
| `pilot_applications` form spam (anonymous insert allowed) | Manual moderation via `status` field — `new` rows are reviewed before counting. If volume becomes painful, add Cloudflare Turnstile (same plan as `/ideas`). |
| Stage 2 fires prematurely on mixed Stage 1 signals | The "≥4 of 5 thresholds" rule is documented at `docs/superpowers/queries/stage-gates.md` and locked before the LinkedIn post. If exactly 3 of 5 hit, extend Stage 1 by 1 week (once) rather than firing Stage 2 on partial signal. |
| Magic-link emails land in Gmail Promotions / spam | Smoke test in Phase 3.5 covers Gmail specifically. If deliverability is poor, configure Google Workspace SMTP as the Supabase Auth sender (instead of Supabase's default). |
| PYQ-weighted AI Coach claim turns out to be aspirational despite Q6=B | The backend repo is not in this codebase — Q6=B is based on user knowledge. On restart, verify the PYQ archive and weighting logic actually exist in the FastAPI backend before re-enabling the marketing claim. If they don't, fall back to the soften-on-restart plan in §6.1 Option C territory. |
| Forgot to stop ACR / Log Analytics / other resources | $20/mo cost alert catches it. Resource group audit at end of Phase 5. |
| SEO impact from /auth being parked | The redirect to `/` returns 301/302 (React Router client-side), not a 404. Robots.txt should disallow `/auth` and protected routes — verify in Phase 5. Canonical for `/` already points at `www.campuspandit.ai`. |
| Ideas form spam (anonymous insert allowed) | Phase 3d ships with `is_published = false` default + manual moderation in Supabase dashboard. If volume becomes painful, add Cloudflare Turnstile in front of submit. Worst case: drop the table and rebuild — no data loss in the rest of the system. |
| Dead PDF/external links in Preparation Materials | Add a quarterly link-check note to the README. For the observe window, accept the risk — drift over 4 weeks is minimal if curated from stable sources (NCERT, OpenStax). |
| New routes don't get indexed in time for the observe signal | Submit updated sitemap via Google Search Console immediately after Phase 3 deploy (`URL Inspection → Request Indexing` for `/blog`, `/materials`, `/roadmap`, `/ideas` individually). Indexing typically happens within 1–3 days for established domains. |
| Blog markdown rendering misses code-block or table styling | Existing `react-markdown` is already used elsewhere in the app. Spot-check the two seed posts render correctly with tables, headings, links. Defer richer features (syntax highlighting, MDX) unless a post needs them. |

## 8. Rollback / restart runbook

### If observe verdict at ~2026-08-21 is "keep going"

The Azure Postgres server is deleted (per Phase 4). The Blob snapshot + the Supabase restore from Phase 1 are the canonical recovery points. Three options ordered by ambition:

**Option A (full restart, recommended if Stage 2 ran with conversion ≥10%):**
1. Execute §6.1 (auth on restart) — user backfill into `auth.users`, AuthContext rewire.
2. Execute §6.2–6.6 (messaging, RLS, Realtime, API rewrites).
3. Smoke test end-to-end against the Supabase data already in place.
4. Effort: 5.25–9 focused days (see §6.7).

**Option B (lean restart — keep observe surface as the product):**
1. Don't touch the legacy consumer app at all (it stays parked).
2. Build out the observe-window features (Ideas, Roadmap, Pilot Application, Blog) into a real B2B platform — Founding 10 onboarding flow, dashboard for the CC owner, etc.
3. Effort: depends on what's actually needed for the first Founding 10. Treat as a separate spec.
4. This is the recommended option if observe → "keep" comes mostly from B2B applications, not from latent demand for the parked student app.

**Option C (resurrect Azure):**
1. Restore the Blob snapshot to a new Postgres instance (Azure Postgres OR Supabase Postgres direct-connection).
2. Restart the Container App: `az containerapp update --min-replicas 1 --max-replicas 3`.
3. Point its `DATABASE_URL` at the restored Postgres.
4. Revert Phase 2 commit on the frontend, redeploy.
5. Smoke test: login, send a message, observe SSE event.
6. RTO: 2–4 hours. End state is identical to pre-park.
7. This is the right option only if you want the legacy consumer app back exactly as it was — e.g., to honor existing student commitments.

### If observe verdict at ~2026-08-21 is "kill"

1. Delete Azure Container App (`az containerapp delete`).
2. Empty and delete the ACR repository.
3. Move the Blob snapshot to cool/archive tier for the remainder of the 365-day retention, then delete.
4. Retain the new Supabase project on free tier as a data archive (negligible cost).
5. Decide separately: keep `www.campuspandit.ai` Static Web App as a public landing for the idea, take down, or repurpose for the next experiment.

## 9. Decisions log

- **2026-05-22:** Backend scope during observe = "Nothing — only B2B landing matters." Container App and Azure Postgres both go cold.
- **2026-05-22:** Supabase target = new project (clean separation from question-bank project `ecnrvbyzbfhrorxwxkms`).
- **2026-05-22:** SSE → Supabase Realtime swap = documented now (§6), implementation deferred to restart phase. EV math: ~3–5 days of work with ~50% chance of being wasted is worse than capturing the design and deferring.
- **2026-05-22:** LinkedIn post timing is independent — post this week after Phase 2 deploy, do not gate on indexing.
- **2026-05-22:** Observe-window auth surface = removed entirely. No login form, no "pilot in setup" page. The signal we want is whether the views attract attention; auth UI is noise relative to that signal. `/auth` and protected routes silently redirect to `/`. Student-landing CTAs redirect to a `mailto:` waitlist.
- **2026-05-22:** Restart-path auth design = passwordless magic-link only (§6.1). No passwords, no signup form, no password-reset flow. Saves ~1 day on the restart estimate and removes password-storage liability.
- **2026-05-22:** Scope intentionally expanded with four content sections (Blog, Preparation Materials, Roadmap, Ideas/Feature Request) added as Phase 3. Rationale: a single Founding 10 landing scroll is thin signal; richer content + transparency gives the observe window something to actually measure. Acknowledged trade-off against `project_bandwidth_and_park` (no new engineering scope) — user explicit override.
- **2026-05-22:** Ideas/Feature Request backend = `feature_requests` table on the new Supabase project (per §5 Phase 3d), with anonymous insert and published-only read. Picked over Google Form / Tally so submitted ideas can be displayed back to visitors (engagement loop) and over `mailto:` so we have structured data for the kill/keep decision.
- **2026-05-22:** Content section nav = top-level on both landings (Blog/Roadmap/Ideas on both, Materials only on `/for-students`). Same routes serve both audiences; audience tagging happens at the content level (post frontmatter, roadmap-item audience field).
- **2026-05-22:** Engagement signal capture = `engagement_signals` table on the new Supabase project, manual entry via Supabase Studio after each LinkedIn / Twitter post, refreshed at 24h / 72h / 7d (§5 Phase 3g). Picked manual over automated because LinkedIn and Twitter APIs for post analytics require paid / partner access — overkill for observe-mode side-bet scale.
- **2026-05-22:** Roadmap content strategy = ship Phase 3c with 2–3 placeholder items, finalize the real items only after ~2 weeks of engagement-signal + feature-request data. Avoids guessing what the market wants; uses the observe window for its actual purpose. `src/data/roadmap.ts` is editable in 5 minutes, no code re-deploy concerns.
- **2026-05-22:** UTM tagging on all social posts (`?utm_source=linkedin|twitter&utm_medium=social&utm_campaign=<post_topic>`) so `link_clicks` in `engagement_signals` can be cross-verified against Google Search Console and any landing-page analytics added later.
- **2026-05-22 (grill Q1):** `/for-students` is meta lead-gen, not a direct-to-student funnel. All `/auth` CTAs on the page route to a `mailto:` waitlist framed as "Tell us about your coaching center." Audience tagging across blog/roadmap/ideas/applications uses `coaching_center | prospective_cc_via_student | both`, not the previous `b2b | student`.
- **2026-05-22 (canonical contact domain):** All `mailto:` CTAs and Supabase Auth senders use `@campuspandit.ai` (matches `www.campuspandit.ai`). `@campuspandit.com` is retained as a Google Workspace alias for backward compatibility.
- **2026-05-22 (timeline):** Observe window extends from 4 weeks to **3 months** (2026-05-21 → ~2026-08-21). Structured as Stage 1 (engagement measurement) + conditional Stage 2 (magic-link conversion).
- **2026-05-22 (grill Q2 / Q3):** Stage 1 thresholds are 5 numeric metrics (visitors/wk, session duration, pages/session, scroll depth on `/`, ideas submissions). Stage 2 fires if ≥4 of 5 hit by end of week 4. Stage 2 conversion threshold = ≥10% of unique visitors convert (passive or active).
- **2026-05-22 (Plausible):** $9/mo Plausible Starter is the Stage 1 measurement tool. Cookieless, no banner needed, supports custom events and UTM tracking. Cross-verified against Search Console for indexed-page CTR sanity-check.
- **2026-05-22 (grill Q4):** Behind Stage 2 magic-link = passive waitlist + auth-gated upvotes on `/ideas`. Either path counts as conversion. Adds `feature_request_votes` table with `(feature_request_id, user_id) UNIQUE` to enforce one-vote-per-person.
- **2026-05-22 (grill Q5):** "Branded app published in 7 days" on the landing is aspirational — the codebase has no Capacitor/Bubblewrap/TWA tooling. Softened to "Branded student web app in 7 days · native Play Store app in pilot month 2–3" before the first social post.
- **2026-05-22 (grill Q6):** AI Coach is real but lives in the parked FastAPI backend. No landing-copy change. Restart path requires verifying the PYQ archive actually exists in the backend before re-enabling that specific claim.
- **2026-05-22 (grill Q7):** "Weekly at-risk students report" and "Tutor performance roll-up" are aspirational — no frontend touchpoint exists in the codebase. Softened to "rolling out in pilot month 2."
- **2026-05-22 (grill Q8):** Founding 10 CTA changes from `mailto:` to a custom Supabase form at `/apply` backed by `pilot_applications` table. Picked over Tally because it (a) colocates with all observe-window data on Supabase, (b) enforces ICP-fit fields as required, (c) avoids third-party iframe on a brand-positioning page. Plausible measures completed-application conversion via `/apply/thanks` page-view goal + `pilot_application_submitted` custom event.
- **2026-05-22 (Constant Contact):** Sync from Supabase to Constant Contact is manual (CSV export weekly) during observe. Edge Function automation deferred to post-observe if the verdict is "keep." Workflow doc at `docs/superpowers/queries/constant-contact-sync.md`.
- **2026-05-22 (Phase 4 strategy):** Azure Postgres Flexible Server is **deleted** (not just stopped) after Blob-snapshot verification. Rationale: 12 weekly re-stop cycles over a 3-month window is too error-prone; the snapshot is the canonical recovery point.

## 10. Out of scope (explicit)

- Replacing the WordPress site at `campuspandit.com` (still redirects to `.ai`).
- The existing question-bank Supabase project (`ecnrvbyzbfhrorxwxkms`) — left alone.
- Off-page SEO work (backlinks, directory submissions) — tracked separately in `project_landing_seo_followups`.
- Native Branded Play Store App pipeline (TWA/Bubblewrap) — deferred until a Founding 10 is signed.
- At-risk-students / tutor-performance Center Dashboard surfaces — Pilot month 2 work.
- Automated Constant Contact integration (Edge Function proxy) — manual CSV sync during observe; automation only if verdict is "keep."
- Visual polish / brand refinement on the new content pages — minimum-viable layouts ship in Phase 3; polish is a separate exercise post-verdict.
- Multi-tenant infrastructure (per-CC theming, subdomain routing, `center_id` filtering) — out of scope until first Founding 10 signs.
