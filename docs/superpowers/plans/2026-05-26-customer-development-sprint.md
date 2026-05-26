# CampusPandit Customer Development Sprint — 30 Days

**Start:** 2026-05-26
**Kill-criterion check:** 2026-06-20 (day 25)
**Sprint deadline:** 2026-06-23 (day 28)
**Sprint end:** 2026-06-25 (day 30)
**Accountability:** Shyam Prasad (DVC), long-time friend, call-you-out type. Pinged 2026-05-26 with kill date and number. Will ping on day 25 to ask "how many calls?".

---

## Why this sprint exists

Realized 2026-05-26: 0 customer conversations, 0 pilot commitments, ~5 months of accumulated artifacts (AWS migration with $25k credits, branded-app architecture, AI Coach, Daily.co video, real-time messaging, prerender pipeline, SEO/GEO infrastructure). Pattern: technical-founder route-around — building product/infra instead of doing the uncomfortable outbound work that B2B SMB SaaS actually requires at this stage.

The observe-window-via-homepage strategy was the wrong instrument for this segment. Indian SMB coaching centers at INR 149/student/month don't self-serve via search; they buy after founder-to-owner WhatsApp + Zoom + personally-promised pilots. The funnel starts with me on the phone.

---

## Pass/fail milestone

| Day | Milestone | Definition |
|-----|-----------|------------|
| 7 | List built | 100 qualified JEE coaching centers in Hyderabad with owner name + at least one channel (WhatsApp / LinkedIn / email) |
| 25 | **Kill check** | ≥4 owner-to-owner calls *completed* (not booked, not "in conversation" — completed with notes) |
| 28 | Conversation goal | 10 completed 30-min owner calls |
| 30 | Outcome goal | 3 verbal pilot commitments — "yes, set us up next month" with a date, not "maybe" |

**Kill criterion (binding):** If <4 completed calls at day 25 (2026-06-20), shut the project down. No extensions. No "the conversations I did have were really insightful." Shyam will ask the number; honor the number.

**Branching at day 25:**
- ≥4 calls, ≥3 commits at day 30 → validated. Phase 2 starts.
- ≥4 calls, 0 commits → wedge/positioning wrong; go back to script + segment, not to product
- <4 calls → structural mismatch confirmed; segment is unreachable by founder outbound *or* I route-around fear. Either way kill.

---

## Outreach playbook

### Channel priority

1. **WhatsApp** — highest open rate for Indian SMB owners
2. **LinkedIn DM** — second-best, especially for owners who post about their batches/results
3. **Cold email** — distant third; treated as spam unless extremely personalized
4. **Cold phone call** — goes to front desk (gatekeeper), not owner. Skip until you have a referral.

### Cadence

- **Per day:** 10-15 outreaches with proper research (not 25-50 templated). Each takes 12-15 minutes including research.
- **Per week:** 50-75 messages. Spreadsheet tracks reply rate by day 5; if <10% replying by week 2, the script or wedge is wrong, not the segment.
- **First 20 sent manually with zero tooling.** No automation, no scrapers, no CRM. Tooling is allowed only after validating the script works at small scale — otherwise tool-building becomes the route-around.

### The discovery script (template)

```
Sir, Sreekanth here.

Saw [ONE SPECIFIC THING — a recent Instagram post about their results /
a JustDial review / a batch announcement / a Google Maps photo].
[ONE SENTENCE OF GENUINE OBSERVATION, e.g. "14 selections including 3 in
top 1000 AIR for a batch that size is impressive."]

I'm researching how coaching centers in Hyderabad in the 100-500 student
range handle [ONE WEDGE BRACKET — parent communication and fee
follow-ups / attendance and mock results / lead nurture from walk-ins].

Not selling anything — I'm building something in this space and want to
learn from owners who are actually running centers at scale before I
build the wrong thing.

Would you have 20 min next week for a call? Whenever works for you.
```

Why each line is there:
- **"Sreekanth here"** — human, not corporate. Never "founder of CampusPandit Pvt Ltd."
- **Specific observation** — proves research, not mass blast. The compliment must be real.
- **"How do you handle X"** — observational frame, not pitch frame. They get to be the expert.
- **"Not selling anything"** — disarms gatekeeper instinct. Critical for Indian SMB where unknown-number WhatsApp = presumed scam/sales call.
- **"Building something"** — honest but vague enough not to trigger feature-rebuttal.
- **"Owners running centers at scale"** — flatters their expertise.
- **"20 min next week"** — specific small ask. "30 min sometime" feels too big and too vague.

### What NOT to send

- "Hi sir, I'm Sreekanth, founder of CampusPandit. We've built an AI-powered white-label platform for coaching centers with branded student apps, AI Coach, integrated CRM, and parent dashboards. We're offering a free 3-month pilot..."
- Anything that opens with you.
- Anything that lists features.
- Anything that asks for a demo before they know you.
- Anything generic — `[city]` left in, `[their center name]` left in, "I noticed your center" without specifics.

### Conversation goals (when they reply yes)

The 20-min call is **discovery**, not demo. Your job is to hear them say in their own words:
- What's the most painful part of running this center daily?
- What's a workaround they've built that they hate?
- What software do they use today? What did they try and abandon?
- What would have to be true for them to change software?
- Who else in the center makes the buy decision?

If you find yourself pitching CampusPandit features in the first call, you've failed. The first call is *only* listening.

---

## Tracking spreadsheet

Six columns, one row per outreach:

| Date sent | Center name | Owner name | Channel | Reply by day 5? (Y/N) | Notes |

Update daily. At day 25, the spreadsheet IS the kill-criterion check.

---

## Daily checklist (first 7 days)

- [ ] Day 1 (2026-05-26): Sent Shyam accountability message ✓
- [ ] Day 2: Spreadsheet of 25 Hyderabad JEE coaching centers — name, owner, Instagram/Facebook URL
- [ ] Day 2: Send first 5 messages (proper per-recipient research, no template-blast)
- [ ] Day 3: 10 messages
- [ ] Day 4: 10 messages
- [ ] Day 5: Check reply rate from day 1-2 sends; tune script if 0 replies
- [ ] Day 6-7: 15-20 more messages; complete the 100-center list
- [ ] End of week 1: 100 centers in spreadsheet, ~50 outreaches sent, first replies tracked

---

## The route-around guard rails

**The biggest risk over the next 30 days is doing infrastructure/product/SEO work instead of conversations.** Pattern from past 5 months is unambiguous. Rules:

1. **No new product features** until day 30. Existing code is sufficient for demos.
2. **No infrastructure work** until day 30. AWS migration can sit. Frontend merge can sit.
3. **No new SEO/content work** until day 30. Sitemap is shipped; that's enough.
4. **No tooling for the outbound** itself until 20 manual sends are done. No Apify scrapers, no email CRM, no Zapier flows.
5. **When stuck or uncomfortable, default to "make one more call," not "build one more thing."**

If I find myself opening VS Code instead of WhatsApp during this sprint, that's the signal to stop and check the spreadsheet.

---

## When this sprint succeeds or fails

**Day 25 (2026-06-20)** — Shyam pings. Honest answer.

- Hit 4+ calls → continue to day 28
- Below 4 → kill announcement. Update memory. Move on.

**Day 30 (2026-06-25)** — Review:
- 3+ verbal commits: write the pilot onboarding spec; raise commits to written contracts; product work resumes targeted at first pilot's needs
- 0 commits but 10 calls: write a "what I learned about the segment" doc; decide whether to revise wedge or pivot to a different segment
- Anything below 10 calls: see day 25 rules

---

## References

- Original B2B pivot positioning: [[b2b-pivot]]
- Bandwidth + park decision (now superseded by this sprint): [[bandwidth-and-park]]
- Domain glossary: `CONTEXT.md`
- This sprint exists because of grilling session 2026-05-26 that surfaced 0 conversations + 0 pilots + structural cold-outreach discomfort + route-around pattern
