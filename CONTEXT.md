# CampusPandit Domain Glossary

This file is a glossary, not a spec or a scratchpad. Each entry is a noun, defined precisely. Add a term when its meaning sharpens during a design conversation; update a term when its meaning changes.

## CampusPandit

The platform — software, AI, and infrastructure — that powers coaching-center-branded apps. Students do not typically see this brand; they see their coaching center's branded surface. CampusPandit is the supplier, not the consumer-facing product.

## Coaching Center

The customer. Owns the student relationship, brand, content, and fees. Buys CampusPandit as the platform underneath its own branded student app and operations dashboard. Pays a per-active-student monthly fee after the pilot ends.

## Student

An end-user of a *coaching center's branded app*. **NOT** a direct customer of CampusPandit. Discovers CampusPandit only incidentally (e.g., via the public marketing site or as a curious user investigating what tech the CC uses).

## Prospective Coaching Center

A coaching center owner who has not yet enrolled. Reached primarily via the B2B landing page at `/`. Submits applications via `mailto:` to the canonical contact address.

## Prospective CC via Student

A coaching center reached *indirectly* — a student lands on `/for-students`, decides CampusPandit is the right tech, and tells their coaching center to inquire. The student is not the funnel target; the CC they bring is. This is the resolved purpose of the `/for-students` page (see ADR-0001 once written).

## Founding 10

The first cohort of coaching centers signed for the pilot programme. Cap of 10 spots. Each spot includes 3 months at zero cost (up to 100 students) and founder pricing locked for the lifetime of the engagement. Goal: prove the model with named logos.

## Pilot

The first 3 months of a Founding 10 engagement. Zero cost, up to 100 students, full platform access. Pilot ends with a transition to the Growth plan (founder pricing). A "Pilot" is bounded in time; after it, the same coaching center is a "Customer."

## Customer

A coaching center on a paid plan (Growth or Center+) after the Pilot ends. Distinct from "Pilot" because billing has started and the relationship is no longer probationary.

## Observe Window

The **3 months** from **2026-05-21** during which CampusPandit operates in minimum-spend mode (consumer app parked, infrastructure cold) while signals are collected to inform a kill/keep verdict at the end of the window. Structured as a two-stage test (see Stage 1 / Stage 2 below).

## Stage 1

The **first ~2 weeks** of the Observe Window. Measures on-site engagement only (no auth, no sign-up). Goal: determine whether the audience is engaged enough to bother testing conversion. If Stage 1 thresholds trip (see spec §5), Stage 2 is triggered.

## Stage 2

The **conditional** middle phase of the Observe Window (typically weeks 3–8, gated on Stage 1 success). Adds magic-link authentication and measures conversion. If Stage 1 does not trip, Stage 2 never runs and the experiment concludes at the end of Stage 1.

## Engagement (Stage 1 noun)

A visitor's interaction with the public site, measured *anonymously and on-page*: sessions, session duration, pages per session, scroll depth, and form submissions to `/ideas`. Captured by an analytics tool (Plausible) plus the `feature_requests` table on Supabase. Distinct from Engagement Signal (below), which is a separate manual capture.

## Engagement Signal (manual social capture)

A row in the `engagement_signals` Supabase table recording the platform-side metrics for a single LinkedIn or Twitter post (impressions, likes, comments, shares, link_clicks). Captured manually by the operator from each platform's native analytics. Distinct from Engagement (above), which is automatic and on-site.

## Conversion (Stage 2 noun)

A visitor's transition from anonymous to identified via magic-link sign-in. Two forms are equally valid:
- **Passive** — the visitor submits an email to be on the notification list.
- **Active** — the visitor signs in specifically to upvote an idea on `/ideas`.
Either form is counted toward the Stage 2 threshold.

## Upvote

An authenticated visitor's signal of support for a published `feature_request`. One vote per visitor per idea, enforced by a `(feature_request_id, user_id) UNIQUE` constraint in the `feature_request_votes` table. Anonymous visitors can submit and read ideas, but cannot upvote — upvote is the engagement primitive that gives magic-link auth a reason to exist.

## Audience (content tagging)

The intended reader of a blog post, roadmap item, or feature-request submission. Allowed values: `coaching_center`, `prospective_cc_via_student`, `both`. **Do not use** `student` as a content audience — students are not the funnel target after the B2B pivot. (Resolved 2026-05-22 from grill-with-docs Q1.)

## Canonical Contact Domain

`@campuspandit.ai`. Matches the marketing-site domain (`www.campuspandit.ai`) so visitors see a coherent identity. `@campuspandit.com` remains active as a forwarding alias inside Google Workspace so historical references and the WordPress redirect chain do not break.

## Branded App (aspirational umbrella term)

The promise on the marketing site that each Coaching Center gets its own student-facing app under its own brand. **As of 2026-05-22 this is aspirational** — the codebase has no Capacitor / Bubblewrap / TWA tooling and no per-tenant theming or domain routing. Resolves to two concrete sub-deliverables (below) with staged timelines. (Resolved 2026-05-22 from grill-with-docs Q5.)

## Branded PWA

The **7-day deliverable** for a Founding 10 Pilot. A copy of the Vite/PWA build with the CC's logo, name, colors, and (eventually) custom domain. Installable on Android via the browser's "Add to Home Screen" prompt; behaves like an app. Lives at a CC-specific subdomain or per-tenant Static Web App. This is what "Branded app published in 7 days" on the landing page actually refers to — copy on the landing must explicitly say "Branded PWA" or "Branded web app" to be honest.

## Branded Play Store App

The **month-2–3 deliverable** for a Founding 10 Pilot — a Trusted Web Activity (TWA) wrapper around the Branded PWA, published to the Google Play Store under the CC's developer account (or CampusPandit's if the CC does not have one). Requires Bubblewrap or similar tooling to be built first; not currently in the codebase. Apple App Store deliverable follows later (~month 3+) due to Apple's review timeline.

## Founders (sender label)

`founders@campuspandit.ai` is the canonical sender/recipient for all `mailto:` CTAs and public correspondence. Plural by convention, even when only Sreekanth is active. Keeps the door open for cofounders without rewriting copy.

## AI Coach

The CampusPandit-branded coaching feature pitched on the landing page as "AI tutor for every student — diagnosing weak chapters by PYQ." **Real product, but it lives in the parked FastAPI backend** (the Container App being scaled to 0 in spec §5 Phase 4). The frontend (`src/components/coaching/AICoach.tsx`, `src/utils/coachingAI.ts`, `src/services/coaching.ts`) is UI + service-stub scaffolding only; the actual LLM calls and PYQ-weighted diagnosis logic run on the backend. During the Observe Window the AI Coach is therefore unreachable; restoring it is part of the documented restart path (spec §6, no additional scope beyond unparking). (Resolved 2026-05-22 from grill-with-docs Q6.)

## Center Dashboard

The Coaching Center owner-facing operations view pitched on the landing page as "one dashboard to run the whole center" — leads, enrollments, fees, attendance, mock scores, parent comms, tutor scheduling, at-risk-students report. **Partially real, partially aspirational** as of 2026-05-22:
- **Real:** a generic B2B CRM exists at `/crm` (contacts, deals, tickets, tasks, sales pipeline). This is what the CampusPandit team uses for its own sales process, not a CC owner's operations dashboard.
- **Aspirational:** at-risk-students auto-report, tutor performance roll-up, enrollment/attendance/mock-score aggregation, parent communications hub, multi-tenant filtering by `center_id` — none visible in the codebase, frontend or stubs. Targeted for Pilot month 2 delivery.
Landing copy must distinguish what is shipped today from what rolls out in Pilot month 2. (Resolved 2026-05-22 from grill-with-docs Q7.)

## Constant Contact

The team's email marketing platform of record (existing paid account, separate from CampusPandit infrastructure). Used for drip campaigns, broadcast newsletters, and engagement analytics (opens, clicks). **During the Observe Window, sync to Constant Contact is manual** — operator exports new rows from `pilot_applications`, `feature_requests` (where `submitter_email IS NOT NULL`), and Stage 2 magic-link signups to CSV weekly and uploads to the relevant CC list. Automation via Supabase Edge Function is documented for post-observe if the verdict is "keep" — see `docs/superpowers/queries/constant-contact-sync.md` for the manual workflow. (Resolved 2026-05-22 from grill-with-docs Q8.)

## Pilot Application

A coaching center owner's submission of interest in the Founding 10 pilot. Submitted via the `/apply` page (a custom Supabase form), lands in the `pilot_applications` table on the new Supabase project, generates a Plausible conversion event when the visitor reaches `/apply/thanks`. Replaces the previous `mailto:` link as the primary B2B conversion path — `mailto:` could only measure intent-to-apply (clicks), the form measures completed applications and enforces the ICP-fit fields needed for the verdict criteria. (Resolved 2026-05-22 from grill-with-docs Q8.)
