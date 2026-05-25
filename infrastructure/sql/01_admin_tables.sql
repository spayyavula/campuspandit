-- infrastructure/sql/01_admin_tables.sql
-- Source-of-truth schema for the 4 observe-window admin tables.
-- Matches the table contracts in docs/superpowers/specs/2026-05-22-park-consumer-app-supabase-migration-design.md §5.

CREATE TABLE IF NOT EXISTS pilot_applications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  center_name     text NOT NULL,
  owner_name      text NOT NULL,
  location        text NOT NULL,
  students_count  integer NOT NULL CHECK (students_count BETWEEN 1 AND 100000),
  subjects_taught text[] NOT NULL,
  current_software       text,
  website_or_instagram   text,
  contact_email   text NOT NULL,
  contact_phone   text,
  message         text
);

CREATE TABLE IF NOT EXISTS feature_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  title           text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  description     text CHECK (description IS NULL OR char_length(description) <= 2000),
  audience        text NOT NULL CHECK (audience IN ('coaching_center', 'prospective_cc_via_student', 'both')),
  submitter_email text,
  upvotes         integer NOT NULL DEFAULT 0,
  is_published    boolean NOT NULL DEFAULT false
);
CREATE INDEX idx_feature_requests_published_created
  ON feature_requests (is_published, created_at DESC) WHERE is_published;

CREATE TABLE IF NOT EXISTS engagement_signals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  signal_type text NOT NULL,
  url         text NOT NULL,
  session_hash text,
  payload     jsonb
);

CREATE TABLE IF NOT EXISTS feature_request_votes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  feature_request_id uuid NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  voter_email text NOT NULL,
  UNIQUE (feature_request_id, voter_email)
);
