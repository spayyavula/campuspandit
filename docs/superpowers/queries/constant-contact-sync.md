# Manual Constant Contact Sync Workflow

Referenced from `docs/superpowers/specs/2026-05-22-park-consumer-app-supabase-migration-design.md` §2 and §9.

During the 3-month observe window, sync from the new Supabase project to Constant Contact is **manual** — weekly CSV export → CC list upload. Edge Function automation is documented at the bottom of this file but deferred to post-observe.

---

## Weekly cadence

Every Monday morning (or whichever day works for the operator):

1. Open Supabase Studio → SQL Editor on the new Supabase project.
2. Run the three queries below, one at a time.
3. Save each result as CSV via the "Download CSV" button.
4. Open Constant Contact → Contacts → Add Contacts → Upload from File.
5. Upload each CSV to its respective list (lists pre-configured per audience — see "List setup" below).
6. Repeat next Monday.

---

## Queries

### Q1: New Pilot Applications

```sql
SELECT contact_email AS email,
       owner_name    AS first_name,
       center_name   AS company,
       location      AS city,
       contact_phone AS phone,
       'Pilot Application' AS source,
       to_char(created_at, 'YYYY-MM-DD') AS submitted_on
FROM pilot_applications
WHERE created_at > (now() - interval '7 days')
  AND status IN ('new', 'reviewed', 'accepted')
ORDER BY created_at;
```

Upload to CC list: **Founding 10 Pilot Applications**

### Q2: New Idea submitters who left email

```sql
SELECT submitter_email AS email,
       'Idea: ' || title AS notes,
       'Ideas Community' AS source,
       to_char(created_at, 'YYYY-MM-DD') AS submitted_on
FROM feature_requests
WHERE submitter_email IS NOT NULL
  AND submitter_email != ''
  AND created_at > (now() - interval '7 days');
```

Upload to CC list: **Ideas Community**

### Q3: Stage 2 magic-link signups (only after Phase 3.5 fires)

```sql
SELECT email,
       to_char(created_at, 'YYYY-MM-DD') AS signed_up_on
FROM auth.users
WHERE created_at > (now() - interval '7 days')
ORDER BY created_at;
```

Upload to CC list: **Newsletter / Stage 2 Waitlist**

---

## List setup (one-time, in Constant Contact dashboard)

Create three lists with these exact names so future syncs land cleanly:

1. **Founding 10 Pilot Applications** — coaching center owners who applied via `/apply`. Drip: Day 0 (auto-confirmation), Day 3 ("here's what happens next"), Day 7 ("scheduling a call"), Day 14 ("last touch before close").
2. **Ideas Community** — anyone who submitted an idea with an email. Drip: monthly "what shipped from your ideas" digest.
3. **Newsletter / Stage 2 Waitlist** — magic-link signups. Drip: bi-weekly product update.

Set each drip campaign to start when a contact is added to the list, with **no** overlap between lists (a contact who applies AND signs up should sit in both, get both drips).

---

## Anti-drift safeguards

- Add a recurring weekly calendar reminder titled "CC sync" — Monday 10:00 AM.
- After each upload, paste the CC import-summary screenshot into a shared note dated for the week, so future-you can verify nothing was skipped.
- If three weeks go by without a sync, applications start landing on Day 21 of nurture-silence — the application contact would have stopped expecting follow-up. At that point, send a manual one-off "still interested?" email to anyone who applied >14 days ago.

---

## Post-observe automation (only if verdict is "keep")

Replace manual sync with a Supabase Edge Function:

1. Create `supabase/functions/sync-constant-contact/index.ts`.
2. Function reads new rows from each source table (with a `synced_to_cc_at` watermark column added to each).
3. Calls Constant Contact API v3 `POST /v3/contacts` per row with appropriate list_id.
4. Updates `synced_to_cc_at` on success.
5. Schedule via Supabase cron (`pg_cron` extension) every 15 minutes.

Estimated effort: 0.5 day. Justified only if observe → "keep" and weekly manual sync becomes painful (volume > ~50 new contacts/week).

API docs: https://developer.constantcontact.com/api_reference/index.html#!/Contacts/createContact_v3
