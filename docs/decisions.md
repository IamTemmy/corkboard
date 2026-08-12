# Corkboard — Decision Log

Why things are the way they are. This complements `plan.md` (what to build) by recording *why* — including what was considered and rejected, so decisions don't get quietly re-litigated or accidentally undone.

---

## Name: "Corkboard"

**Provisional.** Chosen because campuses already use physical bulletin boards for exactly this, it isn't tied to one school (survives multi-campus expansion), and it's a real word people remember — unlike the placeholder "Campus Marketplace."

Cheap to change until a domain is purchased. Don't treat it as locked.

## Visual direction: the corkboard concept

The signature elements are **the pin on each listing card** and **the price set in monospace** (reads like a price tag/receipt). Those two details carry all the personality. Everything else — grid, spacing, type scale, hierarchy — stays disciplined and plain on purpose.

**Rejected:** the "warm off-white background + near-black text + restrained gold accent" direction. It's polished, but it's the pattern almost every AI-generated design lands on right now, so it reads as templated regardless of execution quality.

**Also rejected:** "just make it clean like Apple/Airbnb/Stripe/Linear." Same problem from the other direction — safe, competent, forgettable. The resolution was to keep the distinctive concept but hold its *execution* to that level of precision.

**Explicitly dropped from the original idea:** random card rotation (1–2° tilt). It tipped the design from "intentional" into "craft project."

**Design tokens** (see `mockup.html` for the source of truth):
Ink Navy `#1C2430` · Warm Paper `#F7F1E6` · Marigold `#E7A93B` · Moss `#6E8C6A` · Brick `#B24A34`
Fraunces (display) · Inter (body/UI) · IBM Plex Mono (prices only)

## Contact method: Instagram / GroupMe

Not email, not an in-app inbox. Students already live in those apps; email is where campus messages go to die. Also means zero messaging infrastructure to build, moderate, or maintain.

**Rejected:** email + Venmo handle (the original proposal) — technically simpler but a worse match for actual student behavior.

## No integrated payments

Deliberate, permanent for the foreseeable future. Campus resale is cash/Venmo/CashApp handed over in person. Adding payments brings PCI compliance, fraud liability, chargebacks, refund workflows, and tax handling — none of which improve the core exchange.

## No internal chat, no shipping, no native app

Same reasoning: each one adds a support and moderation burden without improving a transaction between two people who can meet on campus in ten minutes.

## Row Level Security from day one

Enabled on every exposed table and storage bucket, not deferred. Once other students can read and write data, this stops being optional — Supabase exposes the database to the client, so RLS *is* the authorization layer.

*This was the clearest gap in the original plan and was added from review feedback.*

## School-email verification via a Postgres auth hook

Supabase has **no built-in `.edu`-only toggle.** Restricting signups requires a `before-user-created` auth hook (a Postgres function) that checks the email domain against an `approved_email_domains` table.

Storing domains in a table rather than hardcoding them is what makes expansion a **data change, not a code change** — adding a campus later is inserting a row.

**Known limitation:** this proves someone controlled an approved email address at signup time. It does not prove they're honest, still enrolled, or endorsed by the school. Product copy must not overclaim here.

## Identity: a chosen display name, not the J-number

*(Added 2026-08-07, after auth shipped — an example of the docs being living: this refines the original plan now that real accounts exist.)*

A student's identity on Corkboard is a **display name they choose**, not their login. Internally we always have the Supabase user id + verified email; the display name is presentation only.

- The **J-number** (the email local part, e.g. `j00931199`) is a semi-private student ID. It's fine as a private greeting, but must **never** be shown publicly as a seller — so a new profile's `display_name` starts NULL, and the `/welcome` step (shown once after first verification) asks the student how they want to appear.
- A **preferred first name is recommended, not required** — it makes the marketplace friendlier and more trustworthy. A student who'd rather not can pick "use my J-number" (a real JSU identity, not "anonymous"). Changeable later.
- We store no last name; email / J-number / dorm / phone stay private.
- The **"✓ Verified student" badge** — deliberately removed earlier when no auth existed — can return now, but only on listings by real verified accounts, and worded to avoid implying school endorsement (see non-endorsement stance above).

Deferred (not premature-built): the account dropdown menu and seller reputation/ratings — they wait until there are real destinations/transactions to back them.

## Cut from the v1 data model

`contact_events` and `audit_log` were in the reviewed schema but removed for v1 — they're analytics and ops infrastructure for a product with zero users. Revisit if/when Phase 3 (multi-campus) actually arrives.

Same reasoning cut: analytics tooling, custom SMTP, formal metrics dashboard, twice-weekly moderation cadence. All reasonable at scale, all premature now.

## Static prototype before any backend

Build and deploy the homepage with hardcoded listings first. Get it on a real phone, fix what's confusing, *then* connect Supabase.

Rationale: it produces something showable within days, and it front-loads the part that's most uncertain (does it look and feel right?) instead of the part that's most familiar-sounding.

## Expansion gate

Do not add a second campus because the code supports it. Add one when the first campus shows repeat sellers, repeat buyers, manageable reports, and there's a local student at the next school who'll seed listings.

## Positioning: independent student project

Not university-operated or endorsed unless something is signed. Use a neutral name and identity; no school logos, seals, or colors without written permission. Footer carries a non-endorsement line.

---

## Sold listings stay reachable by direct link

*(Added 2026-08-09, pre-launch review.)*

Sold items leave the **public board** (`getListings` filters them out), but a
direct URL `/listings/<sold-id>` still loads and shows a "Sold" state with
contact hidden. This is **intentional**: an old shared link that says "Sold" is
less confusing than one that suddenly 404s, and it leaves room for future
social-proof ("recently sold"). We deliberately chose this over making sold
listings seller-only/404 for the public.

## Security Assessment v1

*(Added 2026-08-10, pre-beta. A deliberate pen-test-style pass: live black-box probes against production + a full source trust-boundary audit, run outside-in rather than the usual inside-out.)*

**Verdict:** no Critical and no active High. The "database is the authority" model holds from both directions — anonymous probes against the live REST API confirmed contact-column privacy, profile/domain-table lockdown, and the gated contact RPC all deny as designed; the source audit confirmed the trusted-field trigger, per-user Storage isolation, reports rules, and a closed XSS surface. Dependencies clean (`npm audit` 0), no secrets in git history.

**Shipped from this pass:**
- **Baseline security headers** (`next.config.ts`): X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, and `poweredByHeader:false`. Defense-in-depth; the DB remains the real boundary. HSTS is already applied by Vercel.
- **H1 — versioned the `listings` base table** (`000-listings-base.sql`). The table, its RLS-enabled state, the public SELECT policy, and the `status` CHECK predated version control and lived only in the live DB. Now idempotently captured so the security model is provable and DR-safe from source.

**Deliberately deferred (with reasons), NOT before the controlled beta:**
- **Content-Security-Policy** — high-value XSS backstop, but a wrong CSP can blank the app (Next hydration uses inline scripts). Do it *before public launch*, not before the small controlled beta, and roll out via `Content-Security-Policy-Report-Only` first. The XSS surface is already confirmed closed, so this is a backstop, not a plugged hole.
- **`images[]` external-URL constraint** — a direct-API caller can point images at an external host (IP-leak/hotlink; can't execute script). Keep with the larger "store Storage *paths*, build URLs server-side" refactor. Post-beta.
- **Email-change domain gate** — `updateUser({email})` can move a *verified* account's login email off-`.edu`. No UI exposes it and campus/user_type persist from signup, so it's not an access bypass. If an email-change UI is ever added, gate it with a before-email-change hook. Documented, no code change now.
- **`status`/`sold_at` consistency CHECK (L3)** — cosmetic; deferred until after demo-data cleanup (one existing sold row has a null `sold_at`), where it becomes a clean no-op.
- **Rate-limiting contact-harvest / OTP / uploads** — a verified student can script the contact RPC across enumerable listing IDs. By-design payoff of verification; watch for abuse in beta rather than pre-building limits. Abuse-volume testing was intentionally NOT run against production.

**Still owed (needs real accounts):** the two-signed-in-student tests (cross-user Storage-image delete, report-own, report dedup) remain verification tasks blocked on Resend — the authenticated attacker matrix is otherwise covered by the SQL role-simulation in `supabase/tests/authz-check.sql`.

## Security Assessment v1 — independent second review

*(Added 2026-08-11. A separate reviewer re-checked the app asking different questions — object enumeration, migration-replay regressions, whether the "trusted" source value is itself trustworthy, and dropped auth-middleware metadata. Every finding was verified against the actual code/library before acting; none were Critical or High. This is the "two-factor" cross-check working — it found real gaps the first, inside-out pass missed.)*

**Fixed before beta:**
- **Display-name impersonation (Med).** A student could set their name to "Campus Police" / "JSU Housing" — the listing-`seller` trigger faithfully copies a *user-controlled* profile name. Now blocked client-side (`lib/display-name.ts`, used by `/welcome` + Settings) **and** at the DB (`014` profiles trigger — the real authority, since the client is bypassable). Reinforces the standing rule: verification proves a campus *email*, not identity or endorsement.
- **Anonymous Storage enumeration (Low–Med).** `004`'s `to public` SELECT on `storage.objects` let anyone *list* the bucket (per-user folders = account UUIDs, object names, orphaned images) via the Storage API — not needed to serve a public bucket. Dropped (`013`); public image URLs still work; the app never calls `.list()`.
- **SSR cache-header propagation (Low, Vercel-mitigated).** `proxy.ts` now copies the `Cache-Control`/`Expires`/`Pragma` headers `@supabase/ssr` passes when it refreshes session cookies (verified in the vendored library types), instead of relying on Vercel not caching `Set-Cookie` responses.
- **Profile field bounds + INSERT (Low).** The DB now enforces `display_name`/`instagram`/`groupme` length (`014` trigger) and revokes client `INSERT` on `profiles` — the signup trigger (SECURITY DEFINER) owns profile creation.
- **Relist UX (Low).** Relisting after clearing all contacts now shows "add a contact method" instead of a generic error.
- **Forward-only migrations (Low).** README no longer implies an *old* migration can be replayed against a fully-migrated DB (re-running `008` would regress `010`'s contact lockdown). Rebuild = run the whole set in order.
- **CI least-privilege (Info).** Workflow token scoped to `contents: read`.

**Deferred (documented, not beta blockers):**
- **Sold listings are bulk-queryable with a stable `seller_id` (Low).** The public read policy is `USING(true)` and anon can read `seller_id`/`status`/`sold_at`, so a direct API call can reconstruct a seller's sold history even after a display-name change — broader than the "direct link stays reachable" intent. Clean fix needs a narrower read surface (view/RPC) or dropping `seller_id` from the anon grant; bundle with the post-beta "store Storage *paths*, not full URLs" refactor (which also removes the external-`images[]` URL risk).
- **CI Action SHA-pinning + Dependabot** — supply-chain hardening beyond the token-scope fix.

## Listing detail page — layout & colour system

*(Added 2026-08-11, after a focused design pass on the listing-detail page — Corkboard's most important screen, where browsing turns into contacting another student. It should be the most polished page in the product.)*

**Three-section right column.** The details column beside the photo is organised as:
1. **Header** — category · condition, title, price · posted date.
2. **Description** — *variable* height; clamped to 3 lines with an in-place "More" toggle (`ListingDescription`). It sits in a `flex-1` band that **centres it vertically**, so on a sparse listing (short text beside a tall multi-photo gallery) it floats to the middle of the free space rather than clinging to the price with a void beneath. A long/clamped description just fills the band (centring has no effect).
3. **Transaction block** — meet-at, listed-by, contact ("Reach"), safety note, and the closing action. Fixed-height, sitting at the **bottom** of the column (the `flex-1` description band above pushes it down), so it anchors the column cleanly regardless of description length.

The result: the column always reads as one composition with the photo — item identity up top, the description floating in the balanced middle, logistics + action anchored at the bottom — regardless of how much the seller wrote. On mobile the grid collapses and everything flows naturally (no equal-height logic).

**Why centre the description rather than relocate the gap:** a tall portrait photo next to short info means empty space *must* exist on sparse listings — no arrangement removes it, only reshapes it (we tried the gap below the content, above the transaction block, and between contact and safety; each was rejected in turn). Centring the short description distributes that whitespace evenly around the one variable element, which read as the most balanced across real listings. The description box / internal-scroll idea was rejected: it reintroduces the card clutter this pass removed, internal scroll is a mobile/trackpad annoyance, and most descriptions are 1–2 lines so the box would sit mostly empty — the clamp already handles long text.

**Bottom-anchored closing action** (ends level with the bottom of the photo):
- Owner viewing their own listing → **Edit listing** (powder blue, matching My Listings).
- Any other signed-in student → **Report listing** (rust).
- Signed out → "Sign in to report" nudge.

Every listing therefore ends on an action with no dead zone, whoever's looking. (The anchor first relied on Report, which is hidden on your *own* listing — leaving the owner's own view empty; the Edit action closes that gap.)

**Meet-safely note** sits just above the closing line (not under the contact chips) as an end-of-visit reminder — a light shield + moss text, no heavy box, hugging the divider so note + line + action read as one closing block.

**Semantic colour system** — each colour owns exactly one job (replaces ad-hoc colouring):
- **Gold / marigold** → item metadata (category · condition) + the contact *action* (Instagram/GroupMe chips + the open-in-app ↗). Small text uses the darker `--color-marigold-text` for contrast on paper.
- **Green / moss** → campus meeting + trust + seller reach (meet-at box, "Reach <name>" label, safety note). Small text uses `--color-moss-text` (AA on paper).
- **Rust / brick** → report / caution — and the signature card pin.
- **Navy / ink** → primary content (title, price, values).
- **Gray** → secondary / meta (posted date, "Listed by", hints).

**Meet-at marker:** a green *location* pin, not the brand's brick pin — the brick pin already appears on the product photo, so repeating it on Meet-at was redundant; the map marker reads correctly for a meetup spot.

**Both contact channels allowed:** a seller may list Instagram *and* GroupMe (the rule is "at least one" on an available listing, not "exactly one"), so the contact block handles 1–2 compact chips.

**Deferred:** gallery height normalization across listings with different photo counts — single-image listings already correctly drop the arrows/counter/thumbnails, so cross-listing height consistency is low-value polish.

## Success definition for this build

Finishing and launching, not maximizing features. A polished, deployed MVP with a handful of real users beats an ambitious unfinished product — especially since this is the first site built solo.
