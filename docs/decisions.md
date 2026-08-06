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

## Success definition for this build

Finishing and launching, not maximizing features. A polished, deployed MVP with a handful of real users beats an ambitious unfinished product — especially since this is the first site built solo.
