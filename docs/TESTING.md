# Corkboard — test log

How we verify the app. A Playwright smoke suite runs in CI on every push
(`npm run test:e2e`); the checks below are the manual ones on top of it. Keep
this updated — check items as they're verified, and add a row to the
**Deployment test log** after each production deploy.

Legend: ✅ passing · ❌ failing · ⬜ not yet tested

> ⚠️ **Before clearing demo data** (`delete from listings;`): the CI Playwright
> "content behavior (assumes demo listings)" tests (search "shoe"/"sneaker",
> board-not-empty, category filter) depend on the seed listings and will go red
> once the board is empty. Skip or reseed those before wiping, so CI isn't red
> for a working app.

---

## Critical-path checklist

### Auth & access control
- ✅ Signed-out visitor can browse the board and open listings
- ✅ Signed-out visitor cannot see seller contact (sees "Sign in to contact")
- ✅ `/new`, `/my-listings`, `/settings`, `/welcome` redirect to sign-in when signed out
- ✅ Non-approved email (e.g. gmail.com) is rejected with the hook's message
- ✅ `@students.jsums.edu` receives a 6-digit code and signs in
- ⬜ Wrong / expired OTP code is rejected

### Listing lifecycle (seller)
- ✅ Create a listing with details + photo
- ✅ Multiple photos (up to 5), first = cover, removable
- ✅ iPhone HEIC photo converts and displays; large photos compress
- ⬜ Edit a listing's details (title/price/category/condition/spot/description) — saved, reflected on the listing and board (Stage 3)
- ⬜ A non-owner cannot open /listings/&lt;id&gt;/edit (redirected) (Stage 3)
- ✅ Mark reserved → stays on board with badge, no contact shown
- ✅ Mark sold → leaves the public board, stays in My Listings
- ✅ Mark available / Relist → returns to the board
- ✅ Delete → removed everywhere
- ⬜ Delete also removes the listing's photos from Storage (Stage 1 — verify)

### Marketplace (buyer)
- ✅ Sold items are absent from the board; reserved remain visible
- ⬜ "Free" chip shows $0 items (Stage 3)
- ✅ Available item shows contact to a signed-in student
- ✅ Search covers title + description + more, with synonyms (shoe↔sneaker↔footwear, tv↔roku) and singular/plural; title hits rank first (Stage 4 tweak)
- ⬜ GroupMe: only real groupme.com links are clickable; junk is rejected on save (Stage 1)

### Identity & contact
- ✅ Display name change updates the header and existing listings
- ✅ Clearing the name falls back to the J-number everywhere
- ✅ School email is never shown as a public contact, even to a signed-in buyer (Stage 2)
- ✅ Publishing requires at least one contact (Instagram or GroupMe) (Stage 2)
- ✅ Changing contact in Settings propagates to existing listings (Stage 2)
- ✅ With active listings, Settings blocks clearing all contact (Stage 2)
- ⬜ A signed-in student querying `profiles` gets only their own row (verify via the attacker/RLS tests)

### Security — test as an attacker (not just the happy path)
These must be rejected by the **database**, not just hidden in the UI. Test with
a second account (Student B) against Student A's listing:
- ⬜ B cannot UPDATE A's listing (status, fields) via direct API
- ⬜ B cannot DELETE A's listing
- ⬜ B cannot replace/delete A's Storage images
- ⬜ B cannot UPDATE A's profile
- ⬜ anon (no session) cannot INSERT/UPDATE/DELETE any listing

### Trust & safety (Stage 4)
- ⬜ `/guidelines` lists prohibited items + community rules; linked from the footer
- ⬜ Listing form blocks posting until the "follows the guidelines" box is ticked
- ⬜ Signed-out visitor sees "Sign in to report"; signed-in sees the report form
- ⬜ Submitting a report inserts a row (visible in the Supabase dashboard)
- ⬜ Reporting the same listing twice shows the thank-you, doesn't error (dedup)
- ⬜ Reports are NOT readable via the client API — only in the dashboard (RLS)
- ⬜ B can report A's listing; the row's reporter_id is B (attacker/RLS check)

---

## Security / attacker matrix

Prove the database rejects hostile requests, not just the UI. Anonymous cases
were verified live against the REST API (all denied). The authenticated cross-
user cases need two real accounts (Student A owns a listing; Student B attacks).

**Anonymous (verified 2026-08-09 — all 401):**
- ✅ read `contact` column → denied
- ✅ INSERT listing → denied
- ✅ UPDATE listing → denied
- ✅ invoke `get_listing_contact` RPC → denied
- ✅ INSERT report → denied
- ✅ (sanity) read `title` → allowed

**Authenticated — Student B against Student A (run these):**
- ⬜ UPDATE A's listing → must fail
- ⬜ DELETE A's listing → must fail
- ⬜ delete A's Storage image → must fail
- ⬜ read A's profile row → must fail (self-only)
- ⬜ report own listing → must fail
- ⬜ create listing with spoofed `seller`/`campus` → DB overrides to B's profile
- ⬜ create listing with invalid `meetup_spot` → must fail
- ⬜ create/patch listing to `contact: {}` while available → must fail
- ⬜ create listing with 0 or 6+ images → must fail
- ⬜ (happy path) B reports A's listing once → succeeds; a second time → dedup

---

## Deployment test log

Record what was verified against production after each deploy.

| Date | Change deployed | Tested | Result |
| --- | --- | --- | --- |
| 2026-08-07 | Full auth + listing loop | End-to-end: sign in, list w/ photo, contact shows, sold leaves board | ✅ |
| 2026-08-07 | Stage 1: GroupMe validation + storage cleanup | Junk GroupMe link rejected; groupme.com accepted | ✅ |
| 2026-08-07 | Stage 2: email private, profiles locked, contact required | Email hidden from contact; publish needs a contact; contact propagates from Settings; can't clear all contact with active listings | ✅ |
