-- ============================================================================
-- CampusPandit observe-window engagement queries
-- Referenced from docs/superpowers/specs/2026-05-22-park-consumer-app-supabase-migration-design.md §5 Phase 3g
--
-- Run against the new Supabase project (the one provisioned in Phase 1).
-- Each query is self-contained and re-runnable.
-- ============================================================================


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


-- Q2: top posts by qualitative engagement
-- (comments + shares is a better signal than likes, which decay toward platform noise)
SELECT post_topic, platform, post_url,
       impressions, likes, comments, shares, link_clicks
FROM engagement_signals
ORDER BY (coalesce(comments, 0) + coalesce(shares, 0)) DESC
LIMIT 10;


-- Q3: topic resonance — which themes pull clicks per impression
SELECT post_topic,
       count(*)                                                     AS posts,
       avg(likes)::int                                              AS avg_likes,
       avg(comments)::int                                           AS avg_comments,
       avg(link_clicks)::int                                        AS avg_clicks,
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
