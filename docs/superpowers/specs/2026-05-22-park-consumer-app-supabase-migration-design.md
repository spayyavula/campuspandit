# Park Consumer App + Migrate Azure Postgres to Supabase

Date: 2026-05-22
Status: Approved for implementation (observe-window phases)
Owner: Sreekanth Payyavula

## 1. Context

CampusPandit is in a 4-week observe window (2026-05-21 → ~2026-06-18) following the B2B coaching-center pivot. The homepage at `www.campuspandit.ai` is now a Founding 10 landing page; everything behind `/auth` is the legacy consumer app (students, tutors, courses, CRM, messaging, video library).

Current production cost is ~$60–115/mo for infrastructure that, during the observe window, serves no traffic the observe signal cares about. The observe signal comes from LinkedIn engagement on the B2B landing and email applications to `founders@campuspandit.com` — neither touches the Container App or Azure Postgres.

This spec covers (a) the work to be done **during** the observe window (park + DB migration) and (b) the documented design for the restart path **if** the observe verdict is "keep going."

## 2. Goals and non-goals

**Goals:**
- Drop monthly infrastructure cost from ~$60–115/mo to ~$5–15/mo within the observe window.
- Preserve all data in Azure Postgres so the restart path is not blocked by data loss.
- Keep `www.campuspandit.ai` (`/` and `/for-students`) serving normally throughout.
- Capture the SSE → Supabase Realtime + auth-cascade design in writing so the restart decision in 4 weeks does not get blocked on re-deriving the architecture.
- Thicken the public surface with four content sections — Blog, Preparation Materials, Roadmap, Ideas/Feature Request — so the observe window has a real signal to measure beyond a single landing scroll. Sections live at top-level public routes, SEO-indexable, no auth.

**Non-goals (observe window):**
- Re-architecting the FastAPI backend.
- Implementing SSE → Supabase Realtime swap (designed here, implemented only on restart).
- Migrating FastAPI custom JWT auth to passwordless magic-link Supabase Auth (designed here, implemented only on restart).
- Consolidating the existing question-bank Supabase project with the new user-data project.
- Re-pointing `campuspandit.com` WordPress redirect.
- Building any auth UI, login form, or "pilot in setup" page — during the observe window there is zero auth surface visible to visitors. Public pages are pure landing/billboard. Returning users hitting old URLs are silently redirected to `/`.

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
  - `/` (B2B landing — Log in nav link removed, CTAs go via `mailto:`)
  - `/for-students` (student landing — all 9 `/auth` CTAs replaced with `mailto:` waitlist links)
  - `/blog`, `/blog/:slug` (content marketing, static markdown, audience-tagged)
  - `/materials` (study resources card grid, student-primary)
  - `/roadmap` (Now/Next/Later transparency view)
  - `/ideas` (feature-request form + published-ideas list, backed by new Supabase project)
- **Parked:** `/auth` and every protected route redirect to `/` via `<Navigate to="/" replace />`. No login form, no "pilot in setup" page, no auth surface at all.
- **Cold:** Azure Container App scaled to min/max-replicas=0 (image retained in ACR). Azure Postgres Flexible Server in stopped state (data preserved on disk). `pg_dump` snapshot of the database stored in Azure Blob with 30-day lifecycle.
- **Data home:** New Supabase project provisioned and seeded with a full restore of Azure Postgres, plus a `feature_requests` table for the Ideas section. Existing question-bank Supabase project untouched.
- **Cost target:** ~$5–15/mo total (Static Web App + ACR Basic + Log Analytics minimum). Supabase free tier covers the new project.

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

**Provision admin tables on the new Supabase project (~30 min)** — two tables that back the new observe-window infrastructure, separate from the restored Azure data:

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
```

### Phase 2 — Park the consumer app and strip auth surface (~1–2h)

Goal: from a visitor's perspective, the site is pure landing/billboard. No mention of login, signup, or "pilot in setup" anywhere visible.

1. Edit `src/components/LandingPage.tsx`:
   - Remove the "Log in" link from desktop nav (~line 47).
   - Remove the "Log in" link from mobile menu (~line 75).
   - Keep all "Apply for pilot" buttons unchanged — they point at the `#apply` anchor which terminates in a `mailto:` link.
2. Edit `src/components/LandingPageStudent.tsx`:
   - Replace every `href="/auth"` (9 occurrences across nav, hero, mid-page CTAs, and footer) with `href="mailto:founders@campuspandit.com?subject=Student%20waitlist&body=I%27d%20like%20to%20be%20notified%20when%20the%20student%20app%20is%20live"`.
   - Verify after edit: `grep '/auth' src/components/LandingPageStudent.tsx` returns no matches.
3. Edit `src/App.tsx`:
   - Define a small helper at the top of `AppRoutes`: `const ParkedRoute = () => <Navigate to="/" replace />;`.
   - Replace the `/auth` route element with `<ParkedRoute />`.
   - For every protected route, replace `<Navigate to="/auth" />` and the protected component with `<ParkedRoute />`. The lazy imports for protected components can stay in the file — unused imports do not affect the bundle once tree-shaking runs.
   - Keep `/` (`LandingPage`) and `/for-students` (`LandingPageStudent`) exactly as-is.
4. Optional defensive change: short-circuit `src/hooks/useSSE.ts` `connect()` when `import.meta.env.VITE_CONSUMER_APP_PARKED === 'true'`. Defense-in-depth — no user-facing effect once routes are parked, but prevents EventSource noise if something is ever rendered by mistake.
5. Deploy via existing Azure Static Web Apps workflow.
6. Smoke test in incognito:
   - `/` renders fully, no "Log in" visible anywhere.
   - `/for-students` renders fully, every CTA opens a `mailto:` draft to `founders@campuspandit.com`.
   - `/auth`, `/coach`, `/messages`, `/crm`, `/courses` — all silently redirect to `/`.
   - Founding 10 application mailto opens correctly.

### Phase 3 — Content sections: Blog, Preparation Materials, Roadmap, Ideas (~2.75d)

Goal: thicken the landing surface from a single Founding 10 page into a content layer that gives visitors reasons to engage and gives the observe window a real signal to measure. All four sections are publicly accessible, no auth, indexable by search engines.

**Routing setup (~0.25d)**
- Add public routes to `src/App.tsx` (before the fallback `*` route): `/blog`, `/blog/:slug`, `/materials`, `/roadmap`, `/ideas`. None wrapped in auth.
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
- Schema and RLS already provisioned in Phase 1 (`feature_requests` table on new Supabase project).
- `src/components/Ideas.tsx`:
  - Form: title (required), description (optional), audience (radio), email (optional). Submit via `supabase.from('feature_requests').insert(...)` using the new project's anon key.
  - List below the form: most-recent 10 published ideas. Pulled via `supabase.from('feature_requests').select(...).eq('is_published', true).order('created_at', { ascending: false }).limit(10)`.
- New env vars in Static Web App config: `VITE_IDEAS_SUPABASE_URL`, `VITE_IDEAS_SUPABASE_ANON_KEY` (separate from question-bank ones so the projects do not get conflated).
- Spam mitigation v1: manual `is_published` flip in Supabase dashboard. v2 (if volume warrants): Cloudflare Turnstile widget in front of submit.

**Sub-step 3e: Nav updates**
- `LandingPage.tsx`: add `Blog · Roadmap · Ideas` to desktop and mobile nav. Do not add Materials (B2B audience does not need it nav-promoted).
- `LandingPageStudent.tsx`: add `Blog · Materials · Roadmap · Ideas` to desktop and mobile nav.

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
```

*Where this feeds back:*
- Run Q1–Q4 weekly during the observe window.
- After ~2 weeks of data, use Q3 (topic resonance) and the published `feature_requests` rows to finalize `src/data/roadmap.ts` content (the items go from placeholder to real, per Phase 3c).
- At end of observe window (~2026-06-18), the same queries inform the kill/keep decision.

### Phase 4 — Shut down Azure compute and DB (~30 min)

- Container App: `az containerapp update --name campuspandit-backend-prod --resource-group campuspandit-rg-prod --min-replicas 0 --max-replicas 0`. Verify with `az containerapp revision list` that no replicas are running. Image remains in ACR.
- Azure Postgres: `az postgres flexible-server stop --name campuspandit-db --resource-group campuspandit-rg-prod`. Note: Azure auto-resumes B-tier servers after 7 days of stopped state. Set a calendar reminder for **2026-05-29** to re-stop, and another for **2026-06-05** as a second cycle, covering the full observe window. If missed, cost impact is ~$0.50/day until caught.
- ACR: leave on Basic tier (~$5/mo). Do not delete repositories.
- Set Azure cost alert at $20/mo (Subscription → Cost Management → Budgets) so any forgotten or auto-resumed resource pings via email.

### Phase 5 — Verify and document (~1h)

- Cost screenshot from Azure Cost Management, dated 2026-05-22, saved to `docs/superpowers/specs/2026-05-22-cost-before.png`. Repeat in 7 days as `cost-after-7d.png`.
- Update `README.md` with a short "Pilot status" note pointing to this spec.
- Add a project-memory entry recording that the park has been executed and where the snapshot lives.

## 6. Restart-path design (implementation deferred)

This section documents the architecture to use **if** the observe verdict is "keep going." It is not implementation-ready code; it is the decisions made now so the restart is not blocked on re-derivation.

### 6.1. Auth migration: FastAPI JWT → Supabase Auth (passwordless / magic-link)

The cascade nobody mentions until it bites: every authenticated API call in the frontend reads `localStorage.access_token`, which today is a FastAPI-issued JWT. If FastAPI dies, all of these break: `messagingAPI`, `coursesAPI`, `tutoringAPI`, `crmAPI`, video uploads, payment history, etc. Auth has to move to Supabase Auth.

**Decision (2026-05-22): passwordless magic-link only — no passwords, no signup form, no password-reset flow.** A user enters their email; Supabase emails them a one-tap link; clicking it establishes the session. This significantly simplifies the migration compared to email/password auth.

Concrete work on restart:

- Rewrite `src/components/Auth.tsx` to a single email-input form. Submit calls:
  ```ts
  await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: 'https://www.campuspandit.ai/auth/callback' }
  });
  ```
  UX: "Check your email — we sent you a sign-in link." No password field, no signup/login mode toggle.
- Create `src/components/AuthCallback.tsx` mounted at `/auth/callback`. On mount, call `supabase.auth.getSession()`; once session is established, redirect to the role-appropriate home (`/coach` for students, `/instructor/dashboard` for tutors, etc.). Handle the error case (expired link, invalid token) with a "Link expired — request a new one" inline message.
- Rewrite `src/contexts/AuthContext.tsx` to derive session from `supabase.auth.onAuthStateChange` rather than localStorage polling. Remove all reads of the legacy `access_token` key.
- Every module that reads `localStorage.getItem('access_token')` switches to either:
  - direct Supabase calls (read/write via `supabase.from(...)`) — preferred where RLS can express the access rules, or
  - calls to Supabase Edge Functions that re-implement business logic, with the user's Supabase JWT auto-attached.
- User backfill — **simpler than password auth:**
  - Existing emails from the Azure Postgres `users` table are bulk-imported into `auth.users` via the Supabase admin API. Supabase supports passwordless accounts natively, so no password hash is needed.
  - Pre-loading (rather than letting `signInWithOtp` create the row on first use) is preferred because it preserves the `users.id` → linked-tables relationship — the existing `user_id` foreign keys across `channels`, `channel_messages`, `courses`, etc. keep pointing at the same UUID.
  - Bulk-import script lives in `scripts/restart/import-users-to-supabase-auth.ts`, run once at restart.
- Supabase Auth email template: configure subject, body, and sender (`founders@campuspandit.com`) in the Supabase dashboard. If Google Workspace SMTP is configured, use it; otherwise accept Supabase's default sender during early restart and migrate to SMTP after.
- Rate limiting: Supabase Auth has built-in rate limiting on magic-link requests (default 4/hour per email). Acceptable.

Benefits vs. email/password:
- No password storage liability for the product.
- No password-reset flow to build (~half-day saved).
- No user-import-with-hashed-passwords compatibility hassle (~half-day saved).
- ~1 full day saved on the restart estimate vs. the original password design.
- Users without a password is inherently lower-risk for a side-bet product.

Drawback:
- Hard dependency on email deliverability. Test deliverability to Gmail, Outlook, and a couple of common Indian ISP domains during restart-phase setup before opening sign-ins to real users.

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

| Block | Estimated days |
|---|---|
| Magic-link auth migration + user backfill (§6.1) | 0.5–1 |
| messagingAPI + RLS + Realtime hook (§6.2, §6.3, §6.5) | 1.5–2 |
| coursesAPI, tutoringAPI, crmAPI rewrites (§6.6) | 2–3 |
| Edge functions for any non-CRUD logic | 1–2 |
| Frontend env config + deploy + smoke tests | 0.5 |
| **Total** | **5.5–8.5 focused days** |

This is the budget the restart decision should be evaluated against. If the observe signal does not justify ~1.5 weeks of focused work, the answer is "kill."

## 7. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Active user mid-session is locked out by the park | Accepted — the "Nothing — only B2B landing matters" decision in §2. PilotInSetup is the graceful expression of this. Data is intact in Supabase, so restart is non-destructive. |
| `pg_dump` misses extensions, sequences, or system data | Snapshot stays in Blob for 365 days. Azure Postgres server is stopped (not deleted) for the first 7 days. Full rollback path: `flexible-server start`, point traffic back. |
| Supabase free tier limits (500 MB DB, pauses on 1-week inactivity) | Free tier auto-resumes on next query. If the Phase 0 `pg_database_size` query shows > 400 MB (buffer for growth), provision Supabase Pro ($25/mo) from the start instead of free — still net positive vs. Azure. |
| Frontend tries to call dead Container App endpoints anyway | Parked routes prevent protected components from mounting. Defensive `useSSE` short-circuit covers the edge case. Worst case is console errors, not user-facing failure. |
| Azure auto-resumes Postgres after 7 days | Calendar reminder set during Phase 4 to re-stop on day 7. Cost impact if missed is ~$0.50/day until caught. |
| Forgot to stop ACR / Log Analytics / other resources | $20/mo cost alert catches it. Resource group audit at end of Phase 5. |
| SEO impact from /auth being parked | The redirect to `/` returns 301/302 (React Router client-side), not a 404. Robots.txt should disallow `/auth` and protected routes — verify in Phase 5. Canonical for `/` already points at `www.campuspandit.ai`. |
| Ideas form spam (anonymous insert allowed) | Phase 3d ships with `is_published = false` default + manual moderation in Supabase dashboard. If volume becomes painful, add Cloudflare Turnstile in front of submit. Worst case: drop the table and rebuild — no data loss in the rest of the system. |
| Dead PDF/external links in Preparation Materials | Add a quarterly link-check note to the README. For the observe window, accept the risk — drift over 4 weeks is minimal if curated from stable sources (NCERT, OpenStax). |
| New routes don't get indexed in time for the observe signal | Submit updated sitemap via Google Search Console immediately after Phase 3 deploy (`URL Inspection → Request Indexing` for `/blog`, `/materials`, `/roadmap`, `/ideas` individually). Indexing typically happens within 1–3 days for established domains. |
| Blog markdown rendering misses code-block or table styling | Existing `react-markdown` is already used elsewhere in the app. Spot-check the two seed posts render correctly with tables, headings, links. Defer richer features (syntax highlighting, MDX) unless a post needs them. |

## 8. Rollback / restart runbook

### If observe verdict is "keep going"

Fast path (resurrect Azure):
1. `az postgres flexible-server start --name campuspandit-db --resource-group campuspandit-rg-prod` (~5 min)
2. `az containerapp update --name campuspandit-backend-prod --resource-group campuspandit-rg-prod --min-replicas 1 --max-replicas 3`
3. Revert Phase 2 commit on the frontend, redeploy via Static Web Apps workflow.
4. Smoke test: login, send a message, observe SSE event.
5. RTO: 1–2 hours.

Clean path (commit to Supabase, kill Azure):
1. Execute §6.1 through §6.6 implementation work (6.5–9.5 days).
2. Verify migrated app against the Supabase data restored in Phase 1.
3. Once stable for one week, delete Azure Container App, ACR repo, Azure Postgres server, blob backup older than 30 days.

### If observe verdict is "kill"

1. Delete Azure Container App, ACR repo, Azure Postgres server, blob backup.
2. Retain new Supabase project on free tier as a data archive (negligible cost).
3. Decide separately: keep `www.campuspandit.ai` Static Web App as a public landing for the idea, or take down.

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

## 10. Out of scope (explicit)

- Replacing the WordPress site at `campuspandit.com` (still redirects to `.ai`).
- Email infrastructure for `@campuspandit.com` addresses (unchanged).
- The existing question-bank Supabase project (`ecnrvbyzbfhrorxwxkms`) — left alone.
- Any visual or copy change to `LandingPage.tsx` or `LandingPageStudent.tsx`.
- Off-page SEO work (backlinks, directory submissions) — tracked separately in `project_landing_seo_followups`.
