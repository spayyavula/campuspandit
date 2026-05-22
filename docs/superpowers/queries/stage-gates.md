# Observe-Window Stage Gates

Referenced from `docs/superpowers/specs/2026-05-22-park-consumer-app-supabase-migration-design.md` §5 Phase 3j and Phase 3.5.

These rules are **locked before the first LinkedIn or Twitter post goes out**. They exist to prevent retroactive redefinition of the verdict ("kinda engaged, let me wait" theater).

---

## Stage 1 → Stage 2 trigger

Stage 1 runs for ~4 weeks (2026-05-22 → ~2026-06-19). At the end of week 4, check the Plausible dashboard against these five thresholds:

| # | Signal | Threshold | Source |
|---|---|---|---|
| 1 | Unique visitors / week (UTM-traceable from LinkedIn/Twitter) | ≥ 100 | Plausible → Visitors, filtered by `utm_source` |
| 2 | Median session duration | ≥ 45 sec | Plausible → Behavior → Visit duration |
| 3 | Pages per session | ≥ 1.8 | Plausible → Behavior → Pages per visit |
| 4 | Scroll depth on `/` reaching the pricing section | ≥ 60% of sessions | Plausible scroll-depth event on `#pricing` |
| 5 | `/ideas` form submissions | ≥ 3 distinct submitters | `SELECT count(DISTINCT submitter_email) FROM feature_requests WHERE created_at > '2026-05-22'` |

**Rule:** Stage 2 fires if **≥ 4 of 5** signals are at or above threshold.

**Edge case (3 of 5):** extend Stage 1 by exactly **1 week** (one-time only). If still 3 of 5 at end of week 5, the experiment concludes without Stage 2.

**Edge case (≤ 2 of 5):** the experiment concludes at end of week 4. No Stage 2.

---

## Stage 2 conversion threshold

Stage 2 runs for the remaining ~8 weeks (~2026-06-19 → 2026-08-21). Conversion is defined as a visitor who triggers EITHER:

- `magic_link_converted` Plausible event (passive — signed in)
- `idea_upvoted` Plausible event (active — signed in and upvoted)

**Rule:** ≥ **10% of unique Stage 2 visitors** convert by 2026-08-21 → "keep going" verdict on the conversion axis.

---

## End-of-window kill/keep verdict (2026-08-21)

The verdict is **not** a single threshold. It is a composite of three signals, weighted by how directly they connect to the business model:

| Signal | Weight | "Keep" threshold | "Kill" floor |
|---|---|---|---|
| **Founding 10 applications from ICP-fit CCs** (50–1,000 students, JEE/NEET focus, India) | 1.0 (primary) | ≥ 3 accepted | ≤ 1 with `icp_fit_score ≥ 7` |
| **Stage 2 conversion rate** (if Stage 2 ran) | 0.5 | ≥ 10% of Stage 2 unique visitors | < 5% |
| **Stage 1 sustained engagement** | 0.25 | All 5 Stage 1 metrics still at threshold at week 12 | 3+ signals decayed below threshold |

**Composite rule:**
- Primary metric (Founding 10 ICP-fit applications) **must** hit ≥ 3 for "keep."
- If primary hits ≥ 3, secondary signals matter only for direction (full restart vs. lean restart per §8 Options A/B/C).
- If primary hits ≤ 1, the verdict is "kill" regardless of secondary signals — there is no audience to monetize.
- If primary is exactly 2, extend by 2 weeks (one-time). If still 2 at week 14, verdict is "kill."

---

## Source-of-truth queries

- Stage 1 metrics 1–4: Plausible dashboard, filter by date range `2026-05-22` to current.
- Stage 1 metric 5 + Stage 2 conversion: `docs/superpowers/queries/engagement-signals.sql` Q5, Q6.
- End-of-window verdict: same SQL + Plausible exports for the period.

If a metric becomes ambiguous (e.g., Plausible's session-duration calculation changes), default to the **lower** reading. Don't lawyer your way into "kinda passing."
