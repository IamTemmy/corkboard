# Campus Marketplace — Merged Best Plan
*Claude's pitch + ChatGPT's pitch, reconciled*

## Side-by-side decision table

| Criterion | Claude's pitch | ChatGPT's pitch | Verdict |
|---|---|---|---|
| Beginner feasibility | Simple, fast MVP, maybe too light | Very structured, arguably heavier than needed for a solo first-timer | **Blend**: ChatGPT's phased sequencing (prototype before backend), Claude's smaller Phase-1 scope |
| Visual quality | Distinctive signature (corkboard) but a real design risk | Safe, consistent, but matches a known AI-generic pattern (warm off-white + near-black + gold) | **Claude's direction**, tempered by ChatGPT's execution discipline (consistent spacing, card system, empty states) |
| Time to useful prototype | Fast — skips auth/backend for v1 | Slower — same idea, but spelled out with more milestones | **Tie** — same underlying plan, ChatGPT's is just more explicit |
| Security | Gap — no mention of Row Level Security | Strong — RLS, server-side validation, secret handling called out explicitly | **ChatGPT's plan wins outright** |
| Operational burden | Addressed (no payments/chat/server) | Addressed more thoroughly (moderation ladder, auto-expiry, report thresholds) | **ChatGPT's plan**, trimmed down (see below) |
| Portfolio value | Good | Good, plus explicit legal/policy conversations, which reads as more mature judgment | **ChatGPT's plan** |
| Expansion readiness | Domain-allowlist table, correctly flagged as a custom auth hook | Domain mapping in schema, but the auth-hook mechanism isn't called out | **Claude's implementation detail**, ChatGPT's staged rollout (with local "campus champion" per school) |
| Evidence discipline | Design trend claims backed by a live search | Backed by cited external sources (Baymard, WCAG, web.dev) | **ChatGPT's plan** — cite sources, don't just assert |

## The merged plan

**Product & scope** — take ChatGPT's framing almost as-is: one campus first, school-email verification, external contact (Instagram/GroupMe > plain email), explicit non-goals (payments, shipping, native app, internal chat), and an expansion *gate* — you don't add a second campus because the code can support it, you add it because the first campus has repeat listings and manageable reports.

**Design direction** — keep the **corkboard concept** as the identity anchor (pinned cards, slight rotation, a price stamped in monospace like a receipt), but adopt ChatGPT's execution discipline around it: fixed card dimensions, consistent spacing/radii/shadows, strong hierarchy (one primary action per screen), skeleton loading states, and real empty-state copy. The corkboard idea gives you something distinctive to point to; their consistency rules keep it from looking amateur.

**Data model & security** — use ChatGPT's schema as the base (`campuses`, `profiles`, `listings`, `listing_images`, `favorites`, `reports`) but **cut `contact_events` and `audit_log` from v1** — they're premature analytics/ops infrastructure for a product with zero users. Add them back only if Phase 3 (multi-campus) actually happens. **Enable Row Level Security on every table from day one** — this was the clearest miss in my original pitch and isn't optional once other students can read/write data.

**Auth** — `.edu`-restricted signup via a Postgres auth hook checking an allowed-domains table (this is the actual Supabase mechanism — there's no built-in domain toggle). Store allowed domains in that table so adding a campus later is a data change, not a code change.

**Stack** — unchanged from both pitches, they agreed independently: Next.js + TypeScript + Tailwind + shadcn/ui + Supabase (Postgres, Auth, Storage) + Vercel + GitHub. Add React Hook Form + Zod for form validation (ChatGPT's addition, worth keeping — cheap and catches bad input server-side). Skip analytics tooling and custom SMTP until Phase 2 actually has users to measure.

**Build order:**
1. Static prototype with your real items (clothes, Beats Pill) — corkboard grid, item detail, no backend, no auth
2. Deploy to Vercel, get it in front of a few friends, fix what's confusing on a phone
3. Connect Supabase: campuses table, `.edu` auth hook, RLS policies, listing CRUD, photo upload
4. Small private pilot (5–10 people) before any public posting
5. Only then: reporting, expansion to a second campus, anything from the "defer" list

**Deliberately trimmed from ChatGPT's plan (not because it's wrong, but because it's early):** twice-weekly moderation cadence, analytics stack, custom SMTP, audit logging, formal metrics dashboard. Revisit all of these the moment real usage makes them necessary — not before.

**Kept from ChatGPT's plan that I'd missed:** Row Level Security, campus-policy conversation checklist, Instagram/GroupMe as the contact method, the "expansion gate" discipline, prohibited-items policy, and the non-endorsement language for talking to university offices.
