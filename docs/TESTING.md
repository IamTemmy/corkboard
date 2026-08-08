# Corkboard — test log

How we verify the app. Manual for now; an automated Playwright suite + CI come in
a later stage. Keep this updated — check items as they're verified, and add a row
to the **Deployment test log** after each production deploy.

Legend: ✅ passing · ❌ failing · ⬜ not yet tested

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
- ⬜ Edit an existing listing (feature pending — Stage 3)
- ✅ Mark reserved → stays on board with badge, no contact shown
- ✅ Mark sold → leaves the public board, stays in My Listings
- ✅ Mark available / Relist → returns to the board
- ✅ Delete → removed everywhere
- ⬜ Delete also removes the listing's photos from Storage (Stage 1 — verify)

### Marketplace (buyer)
- ✅ Sold items are absent from the board; reserved remain visible
- ✅ Available item shows contact to a signed-in student
- ⬜ GroupMe: only real groupme.com links are clickable; junk is rejected on save (Stage 1)

### Identity
- ✅ Display name change updates the header and existing listings
- ✅ Clearing the name falls back to the J-number everywhere
- ⬜ School email is never shown as a public contact (Stage 2)
- ⬜ A signed-in student cannot read other students' emails in bulk (Stage 2 RLS)

### Security — test as an attacker (not just the happy path)
These must be rejected by the **database**, not just hidden in the UI. Test with
a second account (Student B) against Student A's listing:
- ⬜ B cannot UPDATE A's listing (status, fields) via direct API
- ⬜ B cannot DELETE A's listing
- ⬜ B cannot replace/delete A's Storage images
- ⬜ B cannot UPDATE A's profile
- ⬜ anon (no session) cannot INSERT/UPDATE/DELETE any listing

---

## Deployment test log

Record what was verified against production after each deploy.

| Date | Change deployed | Tested | Result |
| --- | --- | --- | --- |
| 2026-08-07 | Full auth + listing loop | End-to-end: sign in, list w/ photo, contact shows, sold leaves board | ✅ |
