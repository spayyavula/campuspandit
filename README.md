# CampusPandit

AI-powered online tutoring platform that connects students with tutors, delivers personalized coaching, and provides a full course/video library — built as a Progressive Web App with a Python FastAPI backend and a React Native mobile companion app.

![Architecture Diagram](./architecture-diagram.svg)

## Table of Contents

- [Overview](#overview)
- [Repository Layout](#repository-layout)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Frontend (Web PWA)](#frontend-web-pwa)
  - [Backend (FastAPI)](#backend-fastapi)
  - [Mobile App (Expo)](#mobile-app-expo)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Database](#database)
- [Real-time Messaging](#real-time-messaging)
- [Payments](#payments)
- [Video & Live Sessions](#video--live-sessions)
- [Deployment](#deployment)
- [Development Scripts](#development-scripts)
- [Additional Documentation](#additional-documentation)
- [Contributing](#contributing)

## Overview

CampusPandit is a multi-surface platform built around three primary capabilities:

1. **AI-powered tutor matching & coaching** — students get matched with tutors and receive AI-driven study guidance, weak-area analysis, and personalized feedback.
2. **Live & recorded learning** — instructors host live video sessions, record studio-quality lessons, publish courses, and stream them through Daily.co, Cloudflare Stream, and Azure Blob Storage.
3. **End-to-end operations** — a built-in CRM (contacts, deals, tickets, marketing campaigns), real-time messaging, multi-gateway payments, and admin tooling for instructors and operators.

### Key Highlights

- **AI Coaching**: Personalized study plans, weak-area detection, and adaptive guidance (OpenAI / Anthropic / Gemini).
- **Tutor Marketplace**: Search, profile, book, and pay tutors with smart scheduling and automated reminders.
- **Live Video Sessions**: Daily.co integration for 1:1 and group tutoring with recording.
- **Video Library**: Upload, record in-browser, and stream lessons via Cloudflare Stream / Azure Blob + CDN.
- **Real-time Messaging**: PostgreSQL `LISTEN/NOTIFY` driven SSE channels — no polling, no separate broker.
- **CRM Suite**: Contacts, deals pipeline, tickets, activities, marketing campaigns, and reports.
- **Multi-Gateway Payments**: Stripe, Razorpay, Instamojo, PayU, PayPal, and Shopify.
- **Progressive Web App**: Offline-first install on desktop and mobile via Workbox.
- **Mobile App**: Expo / React Native companion app for students and tutors.

## Repository Layout

```
campuspandit/
├── src/                          # React 18 + TypeScript PWA (Vite)
│   ├── components/               # Feature components
│   │   ├── coaching/             # AI Coach, weak-area manager
│   │   ├── tutoring/             # Find tutors, booking, registration, dashboards
│   │   ├── courses/              # Course catalog, creation, editor, player, instructor dashboard
│   │   ├── library/              # Video library, recording studio, upload, playback
│   │   ├── messaging/            # Real-time chat UI
│   │   ├── chat/                 # Chat interface primitives
│   │   ├── crm/                  # CRM dashboards (contacts, deals, tickets, campaigns…)
│   │   ├── learning/             # NotebookLM, Google Learn, OpenStax, flashcards
│   │   ├── matching/             # Tutor matching wizard
│   │   ├── payment/              # Stripe & multi-gateway payment buttons + history
│   │   ├── admin/                # Admin panels (coaching, email subscribers)
│   │   └── ui/                   # Reusable design-system primitives
│   ├── contexts/AuthContext.tsx
│   ├── hooks/                    # usePWA, useSSE
│   ├── services/                 # API clients (courses, sessions, chat, AI matching, coaching)
│   ├── utils/                    # supabase, crmAPI, messagingAPI, payment gateways, etc.
│   ├── types/
│   └── App.tsx                   # Lazy-loaded route map
│
├── backend/                      # FastAPI Python backend
│   ├── main.py                   # App entry, lifespan, CORS, logging
│   ├── app/
│   │   ├── api/v1/endpoints/     # auth, matching, chat, channels, coaching,
│   │   │                         # crm, courses, sessions, video_library, sse, admin
│   │   ├── core/                 # config, database, security
│   │   ├── models/               # SQLAlchemy models
│   │   ├── schemas/              # Pydantic schemas
│   │   ├── services/             # AI matching, coaching, video storage
│   │   ├── realtime/pg_listener  # PostgreSQL LISTEN/NOTIFY listener
│   │   ├── sse/sse_manager       # Server-Sent Events fan-out
│   │   ├── middleware/           # Auth context middleware
│   │   └── dependencies/         # FastAPI dependencies
│   ├── scripts/                  # init_db, realtime triggers, tests
│   ├── tests/                    # pytest suite
│   ├── requirements*.txt         # Layered (full, simple, azure, vercel)
│   └── Dockerfile.azure, docker-compose.yml
│
├── mobile-app/                   # Expo / React Native app
│   ├── App.tsx
│   ├── src/
│   │   ├── screens/              # Home, Login, FindTutors, TutorDashboard, Messages, Chat…
│   │   ├── navigation/
│   │   ├── services/             # api, messageService, chatBotService
│   │   ├── hooks/useSession.ts
│   │   └── config/               # env, supabase
│   └── app.json                  # Expo config
│
├── supabase/
│   ├── functions/                # Edge functions (Stripe payment intent, checkout, webhook)
│   └── migrations/               # SQL migrations (CRM, chat, scheduling, payments…)
│
├── scripts/                      # Data tooling (question import/scrape, CSV/TSV utilities)
├── public/                       # PWA manifest, service worker
├── .github/workflows/            # Azure Container Apps + Azure Static Web Apps CI/CD
├── architecture-diagram.svg
└── README.md
```

## Features

### AI Coaching
- Conversational AI coach with subject-aware tutoring
- Automated weak-area detection from session and quiz history
- Personalized study recommendations and goal tracking

### Tutor Matching & Marketplace
- Multi-step tutor matching wizard with AI ranking
- Tutor profiles, registration flow, and dashboards
- Smart scheduling with configurable reminder cadence (24h / 2h / 30m before)
- Automated no-show detection (configurable threshold)

### Live & Recorded Video
- Daily.co rooms for live 1:1 and group sessions
- In-browser recording studio (canvas + camera + screen)
- Direct upload to Azure Blob Storage or Cloudflare Stream
- HLS playback with `video.js` + `@videojs/http-streaming`

### Courses
- Course catalog with search and filters
- Instructor course creation & editor (rich text, lessons, modules)
- Lesson player with progress tracking
- Learning dashboard for students; instructor dashboard for educators

### Real-time Messaging
- 1:1 and channel-based chat
- Server-Sent Events stream backed by Postgres `LISTEN/NOTIFY`
- Reactions, threads, and presence

### CRM
- Contacts, Deals pipeline, Tickets, Activities
- Marketing campaigns with email subscriber management
- Reports & analytics dashboard
- RPC-backed dashboard stats

### Learning Tools
- NotebookLM study guide integration
- Google "Learn Your Way" pathway browser
- OpenStax open-textbook hub
- Flashcard manager with spaced repetition

### Payments
- Stripe (primary, with Edge Function checkout + webhook)
- Razorpay, Instamojo, PayU, PayPal, Shopify (multi-gateway button)
- Payment history and failure/success flows
- Transaction table with gateway-agnostic schema

### Progressive Web App
- Installable on desktop and mobile
- Service worker via Workbox with offline fallbacks
- App icons generated via `npm run pwa:generate-icons`

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Clients                                                        │
│   • Web PWA (React 18 + Vite, lazy-loaded routes)               │
│   • Mobile App (Expo / React Native)                            │
└────────────────┬──────────────────────────┬─────────────────────┘
                 │ REST + SSE               │ REST + Supabase JS
                 ▼                          ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│  FastAPI Backend            │   │  Supabase                   │
│  (Azure Container Apps)     │   │   • Auth (JWT)              │
│   • /api/v1/auth            │   │   • Edge Functions          │
│   • /api/v1/matching        │   │     (Stripe checkout,       │
│   • /api/v1/coaching        │   │      webhook, verify)       │
│   • /api/v1/sessions        │   │   • Storage (assets)        │
│   • /api/v1/courses         │   └──────────────┬──────────────┘
│   • /api/v1/library         │                  │
│   • /api/v1/chat /channels  │                  │
│   • /api/v1/crm             │                  │
│   • /api/v1/sse  (SSE)      │                  │
│   • /api/v1/admin           │                  │
│   • pg_listener LISTEN/NOTIFY◄──────────────────┘
└────────┬───────────┬────────┘
         │           │
         ▼           ▼
┌────────────────┐  ┌──────────────────────────────────────────┐
│  PostgreSQL    │  │  External Services                       │
│  (Azure /      │  │   • OpenAI / Anthropic / Gemini  (AI)    │
│   Supabase)    │  │   • Daily.co                  (video)    │
│                │  │   • Cloudflare Stream + Azure Blob (CDN) │
│                │  │   • Stripe / Razorpay / PayU / Instamojo │
│                │  │   • SendGrid (email), Twilio (SMS)       │
│                │  │   • Firebase (push notifications)        │
│                │  │   • Sentry (errors)                      │
└────────────────┘  └──────────────────────────────────────────┘
```

See [architecture-diagram.svg](./architecture-diagram.svg) for the visual diagram.

## Tech Stack

### Frontend (Web PWA)
- React 18.3, TypeScript 5.5, Vite 5.4
- React Router DOM 6 with lazy-loaded routes
- TailwindCSS 3.4
- Supabase JS Client 2.39
- KaTeX 0.16, React Markdown 9, React Quill 2 (rich text)
- video.js 8 + `@videojs/http-streaming` (HLS)
- React Player 2.13, React Sketch Canvas 6 (recording studio)
- Daily.co (`@daily-co/daily-js`, `@daily-co/daily-react`)
- Stripe (`@stripe/react-stripe-js`, `@stripe/stripe-js`)
- vite-plugin-pwa 0.20 + Workbox 7
- Lucide React (icons), react-dropzone, react-mosaic-component, react-resizable

### Backend (FastAPI)
- Python 3.11+, FastAPI 0.109, Uvicorn
- SQLAlchemy 2 (async) + asyncpg, Alembic migrations
- Pydantic 2 + pydantic-settings
- JWT auth (`python-jose`, `pyjwt`), passlib + bcrypt
- OpenAI 1.10, Anthropic 0.8, LangChain 0.1, tiktoken, scikit-learn (AI matching)
- Celery 5 + Redis (background jobs)
- SendGrid (email), Twilio (SMS), Firebase Admin (push)
- Loguru, Sentry SDK, Prometheus client

### Mobile (Expo)
- Expo SDK 54, React 19, React Native 0.81
- React Navigation 6 (native-stack + bottom-tabs)
- Supabase JS, AsyncStorage, SecureStore
- react-native-paper, react-native-gifted-chat
- expo-camera, expo-image-picker, expo-device

### Infrastructure
- Azure Container Apps (backend)
- Azure Static Web Apps (frontend)
- Azure PostgreSQL Flexible Server (primary DB)
- Azure Container Registry (Docker images)
- Azure Blob Storage + CDN (video assets)
- Cloudflare Stream (alternative video backend)
- Supabase (auth, edge functions, storage)
- GitHub Actions (CI/CD)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+ (for backend)
- PostgreSQL 14+ (local) or Supabase project
- Optional: Redis (for backend background tasks)
- Optional: Expo CLI (for mobile app)

### Frontend (Web PWA)

```bash
# From repo root
npm install
cp .env.example .env       # Fill in Supabase + Stripe keys
npm run dev                # Starts Vite at http://localhost:5173
```

Available scripts (from `package.json`):

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm run pwa:generate-icons` | Regenerate PWA icons |
| `npm run import-questions` | Bulk-import questions from CSV (see [Development Scripts](#development-scripts)) |
| `npm run scrape-questions` | Scrape questions from OER sources |

### Backend (FastAPI)

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env       # Fill in DATABASE_URL, SUPABASE_*, AI keys, etc.

# Initialize the database (creates tables + triggers for realtime)
python scripts/init_db.py
python scripts/setup_realtime_triggers.py

# Start the API
uvicorn main:app --reload --port 8000
```

The API will be available at:
- **Base URL**: `http://localhost:8000`
- **Swagger UI**: `http://localhost:8000/api/docs`
- **ReDoc**: `http://localhost:8000/api/redoc`
- **Health**: `http://localhost:8000/health`

#### Docker (optional)

```bash
cd backend
docker compose up --build
```

### Mobile App (Expo)

```bash
cd mobile-app
npm install
npx expo start            # Then press i / a / w for iOS / Android / web
```

Configure `mobile-app/src/config/env.ts` and `supabase.ts` with your backend URL and Supabase keys.

## Environment Variables

### Frontend (`.env`)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:8000
```

See [.env.example](./.env.example) for the complete list (video storage, Daily.co, Gemini, etc.).

### Backend (`backend/.env`)

Key variables (see [backend/.env.example](./backend/.env.example)):

- `DATABASE_URL` — `postgresql+asyncpg://user:pass@host:5432/db`
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `SENDGRID_API_KEY`, `FROM_EMAIL`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- `REDIS_URL`, `CELERY_BROKER_URL`
- `ALLOWED_ORIGINS` (comma-separated)
- `REMINDER_INTERVALS=1440,120,30` and `NO_SHOW_THRESHOLD_MINUTES=15`
- `SENTRY_DSN` (optional)

## API Documentation

Interactive OpenAPI docs are served by FastAPI at `/api/docs` and `/api/redoc`.

### Endpoint Groups (`/api/v1`)

| Prefix | Tag | Purpose |
|---|---|---|
| `/auth` | Authentication | Signup, login, token refresh |
| `/matching` | AI Matching | Tutor matching, ranking |
| `/chat` | Chat & Messaging | 1:1 messages |
| `/channels` | Channels | Group channels, threads, reactions |
| `/coaching` | AI Coaching | Coach conversations, weak-area analysis |
| `/sse` | Real-time SSE | Server-Sent Event stream |
| `/admin` | Admin | Admin-only operations |
| `/crm` | CRM | Contacts, deals, tickets, activities, campaigns, reports |
| `/sessions` | Video Sessions | Daily.co room lifecycle, recorded sessions |
| `/courses` | Courses | Course CRUD, lessons, enrollment |
| `/library` | Video Library | Upload, streaming, video metadata |

### Frontend Service Clients

The web app talks to the backend via wrappers in `src/services/`:

- `api.ts` — generic Axios-style client with auth interceptor
- `courseAPI.ts` — courses & lessons
- `sessionAPI.ts` — live sessions and recordings
- `chat.ts`, `aiMatching.ts`, `coaching.ts`, `cloudflareUpload.ts`
- `src/utils/crmAPI.ts`, `messagingAPI.ts`, `tutoringAPI.ts`, `flashcardAPI.ts`
- Payment gateway wrappers: `stripePayment.ts`, `razorpayPayment.ts`, `instamojoPayment.ts`, `payuPayment.ts`, `shopifyPayment.ts`

## Database

### Migrations

Supabase migrations live in [supabase/migrations/](./supabase/migrations/). Apply them with the Supabase CLI:

```bash
supabase db push
```

Backend-managed tables are created on FastAPI startup via SQLAlchemy `Base.metadata.create_all` and refined by [backend/scripts/init_db.py](./backend/scripts/init_db.py).

### Major Domains

- **Auth & Profiles** — `users` (Supabase Auth), `profiles`, `roles`, `user_roles`
- **Tutoring** — tutors, availability, bookings, smart-scheduling tables
- **Coaching** — coaching sessions, weak areas, recommendations
- **Messaging** — `channels`, `channel_messages`, `message_reactions`, `user_channels` view
- **CRM** — `contacts`, `deals`, `tickets`, `activities`, `campaigns`, `crm_dashboard_stats` RPC
- **Courses & Library** — `courses`, `lessons`, `enrollments`, `video_sessions`, `recordings`
- **Payments** — `payment_transactions` (gateway-agnostic), Stripe-only migration applied 2025-10-24
- **Scheduling** — session reminders, no-show tracking

Row Level Security (RLS) policies are defined throughout — see `20251013110000_fix_crm_rls_policies.sql` for an example.

## Real-time Messaging

CampusPandit uses **PostgreSQL `LISTEN/NOTIFY` → SSE** instead of a separate message broker:

1. Database triggers `NOTIFY` on inserts to `channel_messages` and `message_reactions`.
2. The FastAPI `pg_listener` (`backend/app/realtime/pg_listener.py`) runs as a background task, listens on those channels, and dispatches payloads to the SSE manager.
3. Clients subscribe to `/api/v1/sse` via `EventSource` — see `src/hooks/useSSE.ts`.

To install triggers on your database:

```bash
cd backend
python scripts/setup_realtime_triggers.py
```

## Payments

| Gateway | Frontend | Backend / Edge Function |
|---|---|---|
| Stripe | `StripePaymentButton.tsx`, `stripePayment.ts` | Supabase edge fns: `create-stripe-payment-intent`, `stripe-checkout`, `stripe-webhook`, `verify-stripe-payment` |
| Razorpay | `razorpayPayment.ts` | Webhook handled in backend |
| Instamojo | `instamojoPayment.ts` | Webhook handled in backend |
| PayU | `payuPayment.ts` | See `PAYU_INTEGRATION.md` |
| PayPal | `PayPalHelpInfo.tsx` | See `PAYPAL_SETUP_GUIDE.md` |
| Shopify | `shopifyPayment.ts` | See `SHOPIFY_PAYMENT_SETUP.md` |

`MultiGatewayPaymentButton.tsx` lets the UI fall back across gateways. All transactions land in `payment_transactions` (migration `20251014000000_create_payment_transactions.sql`).

## Video & Live Sessions

- **Live**: Daily.co rooms created via `/api/v1/sessions` and joined with `@daily-co/daily-react`.
- **Recording**: In-browser via `RecordingStudio.tsx` (canvas + camera + sketch overlay).
- **Upload**: `UploadSession.tsx` → Azure Blob Storage (primary) or Cloudflare Stream (alternative), wired through `cloudflareUpload.ts` and `backend/app/services/video_storage_service.py`.
- **Playback**: `VideoPlayer.tsx` uses `video.js` + HLS streaming, served from Azure CDN or Cloudflare.

## Deployment

### Backend → Azure Container Apps

CI/CD: [.github/workflows/azure-container-apps-backend.yml](./.github/workflows/azure-container-apps-backend.yml)

- Triggers on `main` / `develop` pushes that touch `backend/**`
- Builds `backend/Dockerfile.azure`, pushes to Azure Container Registry
- Updates the target Container App (`campuspandit-backend[-env]`)
- Verifies via `/health` after rollout

Per-environment resource groups: `campuspandit-rg` (prod), `campuspandit-rg-dev`, `campuspandit-rg-staging`.

### Frontend → Azure Static Web Apps

CI/CD: [.github/workflows/azure-static-web-apps-ambitious-river-04fdcd510.yml](./.github/workflows/azure-static-web-apps-ambitious-river-04fdcd510.yml)

Production frontend: `https://ambitious-river-04fdcd510.azurestaticapps.net` (and `https://campuspandit.com`).

### Mobile App

See [mobile-app/DEPLOYMENT_CHECKLIST.md](./mobile-app/DEPLOYMENT_CHECKLIST.md) and [mobile-app/NETLIFY_DEPLOYMENT_GUIDE.md](./mobile-app/NETLIFY_DEPLOYMENT_GUIDE.md).

### Database

- **Production**: Azure PostgreSQL Flexible Server — see [AZURE_POSTGRESQL_DEPLOYMENT_GUIDE.md](./AZURE_POSTGRESQL_DEPLOYMENT_GUIDE.md) and [AZURE_POSTGRESQL_MIGRATION_GUIDE.md](./AZURE_POSTGRESQL_MIGRATION_GUIDE.md).
- **Auth & Edge Functions**: Supabase (kept for auth tokens and Stripe webhooks).

## Development Scripts

### Question Tooling

```bash
# Scrape questions from open educational resources
npm run scrape-questions -- -s openstax,khan -l 100 -t physics,math -o scraped.csv

# Import with optional AI quality checks (OpenAI)
npm run import-questions -- -f questions.csv -k $OPENAI_API_KEY -u
```

Supported scrape sources: OpenStax, Quizlet CC, Khan Academy, OER Commons, CK-12.

CSV format (required columns): `title, content, options, correct_answer`. Optional: `explanation, subject, board, difficulty, grade, topic_tags, question_type, marks, time_limit`.

### Backend Utilities

```bash
cd backend
python scripts/init_db.py                 # Create tables
python scripts/setup_realtime_triggers.py # Install NOTIFY triggers
python scripts/add_missing_columns.py     # Backfill schema drift
python scripts/test_realtime_messaging.py # End-to-end SSE smoke test
pytest tests/                              # Run test suite
```

### CSV / TSV Helpers (`scripts/`)

`camel_to_snake_tsv.py`, `csv_to_tsv.py`, `fix_tsv_headers.py`, `rename_*.py`, `add_uuids.py` — assorted data-cleaning tools used during the original Supabase question seed.

## Additional Documentation

Detailed guides live at the repo root:

- **Setup & Quick Start**: [START_HERE.md](./START_HERE.md), [QUICK_START.md](./QUICK_START.md), [START_BACKEND.md](./START_BACKEND.md)
- **AI**: [AI_COACHING_SYSTEM.md](./AI_COACHING_SYSTEM.md), [AI_MATCHING_GUIDE.md](./AI_MATCHING_GUIDE.md), [QUICKSTART_AI_MATCHING.md](./QUICKSTART_AI_MATCHING.md)
- **Tutoring & Scheduling**: [TUTORING_SYSTEM_GUIDE.md](./TUTORING_SYSTEM_GUIDE.md), [SMART_SCHEDULING_SETUP.md](./SMART_SCHEDULING_SETUP.md)
- **Messaging & Chat**: [CHAT_SYSTEM_GUIDE.md](./CHAT_SYSTEM_GUIDE.md), [QUICKSTART_CHAT.md](./QUICKSTART_CHAT.md), [MESSAGING_SYSTEM.md](./MESSAGING_SYSTEM.md), [REALTIME_MESSAGING_COMPLETE.md](./REALTIME_MESSAGING_COMPLETE.md), [DEPLOY_REALTIME_TO_AZURE.md](./DEPLOY_REALTIME_TO_AZURE.md)
- **CRM**: [CRM_SYSTEM_GUIDE.md](./CRM_SYSTEM_GUIDE.md)
- **Video**: [VIDEO_LIBRARY_COMPLETE.md](./VIDEO_LIBRARY_COMPLETE.md), [VIDEO_LIBRARY_IMPLEMENTATION.md](./VIDEO_LIBRARY_IMPLEMENTATION.md), [RECORDING_STUDIO_GUIDE.md](./RECORDING_STUDIO_GUIDE.md), [RECORDING_STUDIO_COMPLETE.md](./RECORDING_STUDIO_COMPLETE.md)
- **Learning**: [GOOGLE_LEARN_YOUR_WAY_INTEGRATION.md](./GOOGLE_LEARN_YOUR_WAY_INTEGRATION.md), [NOTEBOOKLM_STUDY_GUIDE.md](./NOTEBOOKLM_STUDY_GUIDE.md), [RECOMMENDED_TEXTBOOKS.md](./RECOMMENDED_TEXTBOOKS.md)
- **Payments**: [PAYMENT_GATEWAYS.md](./PAYMENT_GATEWAYS.md), [STRIPE_INTEGRATION_GUIDE.md](./STRIPE_INTEGRATION_GUIDE.md), [PAYU_INTEGRATION.md](./PAYU_INTEGRATION.md), [PAYPAL_SETUP_GUIDE.md](./PAYPAL_SETUP_GUIDE.md), [SHOPIFY_PAYMENT_SETUP.md](./SHOPIFY_PAYMENT_SETUP.md), [PAYMENT_EDGE_FUNCTIONS_SETUP.md](./PAYMENT_EDGE_FUNCTIONS_SETUP.md), [PAYMENT_MIGRATION_GUIDE.md](./PAYMENT_MIGRATION_GUIDE.md)
- **Mobile**: [MOBILE_APP_SETUP.md](./MOBILE_APP_SETUP.md), [MOBILE_APP_COMPLETE.md](./MOBILE_APP_COMPLETE.md)
- **Azure / Backend**: [AZURE_DEPLOYMENT_GUIDE.md](./AZURE_DEPLOYMENT_GUIDE.md), [AZURE_POSTGRESQL_DEPLOYMENT_GUIDE.md](./AZURE_POSTGRESQL_DEPLOYMENT_GUIDE.md), [PYTHON_BACKEND_GUIDE.md](./PYTHON_BACKEND_GUIDE.md), [WEBSOCKET_DATABASE_POOL_FIX.md](./WEBSOCKET_DATABASE_POOL_FIX.md)
- **Design / Marketing**: [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md), [COMPETITOR_ANALYSIS.md](./COMPETITOR_ANALYSIS.md), [EMAIL_MARKETING_SETUP.md](./EMAIL_MARKETING_SETUP.md)
- **Troubleshooting**: [TESTING_GUIDE.md](./TESTING_GUIDE.md), [TROUBLESHOOTING_API_KEY.md](./TROUBLESHOOTING_API_KEY.md), [CORS_FIX_COMPLETE_SUMMARY.md](./CORS_FIX_COMPLETE_SUMMARY.md), [FRONTEND_CORS_FIX_SUMMARY.md](./FRONTEND_CORS_FIX_SUMMARY.md), [PERFORMANCE_OPTIMIZATIONS.md](./PERFORMANCE_OPTIMIZATIONS.md)

## Contributing

### Workflow

1. Fork and create a feature branch: `git checkout -b feature/<name>`
2. Run linting and tests before pushing:
   - Frontend: `npm run lint && npm run build`
   - Backend: `cd backend && pytest && black . && flake8`
3. Open a Pull Request against `main` (or `develop` for in-progress work)
4. CI will build the affected surface (frontend / backend) on Azure

### Code Style

- **TypeScript**: Functional components + hooks, typed props, prefer composition over inheritance
- **Python**: `black` formatting, type hints, async-first with SQLAlchemy 2
- Keep components small and lazy-load route-level chunks (see [src/App.tsx](./src/App.tsx))
- Match existing CRM / Coaching / Tutoring module layout for new features

### Commit Guidelines

- Imperative mood, short summary line (≤ 72 chars)
- Reference issue numbers where applicable
- Keep commits atomic; separate refactors from feature work

## License

Proprietary — all rights reserved. Contact the maintainers for licensing inquiries.

## Support

- Issues: GitHub Issues on this repository
- Email: support@campuspandit.com
- Production: [https://campuspandit.com](https://campuspandit.com)

---

Built with React, TypeScript, FastAPI, PostgreSQL, Daily.co, and modern web technologies.
