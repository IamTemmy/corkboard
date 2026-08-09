# Corkboard

A campus marketplace where **verified students buy and sell in person**. No
shipping, no fees, no middleman — just students meeting at a spot on campus to
hand something over. Built first for Jackson State University (JSU).

> Corkboard is an independent student project — not operated or endorsed by any
> university.

**Live:** https://corkboard-six.vercel.app

## How it works

1. **Sign in with a school email.** Sign-up is a passwordless 6-digit code; the
   first verification creates the account. Only approved `.edu` domains are
   allowed, so everyone on the board is a real student.
2. **Browse or list.** Post an item in under a minute with photos, a price, a
   category, and an on-campus meetup spot.
3. **Meet and swap.** A verified buyer sees the seller's contact (Instagram /
   GroupMe), they agree on a time, and meet at the campus spot in person.

Deliberate non-goals: no in-app payments, no shipping, no internal chat, no
native app. Coordination happens on channels students already use.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** with design tokens in `app/globals.css`; **Base UI** /
  shadcn-style primitives
- **Supabase** — Postgres, Auth (email OTP), and Storage (listing photos)
- **Vercel** for hosting (auto-deploys from `main`)

Fonts: Fraunces (display), Inter (body/UI), IBM Plex Mono (prices). Light mode
only, by design. The signature details are the brick "pin" on each card and
prices set in monospace.

## Getting started

Requires Node 20+ and a Supabase project.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

### Environment variables

Create `.env.local` with your Supabase project's values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-publishable-anon-key>
# Optional — used for absolute URLs in link previews. Defaults to the live site.
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

The anon/publishable key is public by design (Row Level Security is the real
authorization layer). The `service_role` secret is never used in the app and
must not be committed.

### Backend setup

The database, auth, and storage are configured in `supabase/`:

- Run the SQL files in the Supabase SQL editor **in filename order**
  (`auth-and-profiles.sql`, then `002-…` through `007-…`). Each is re-runnable.
- Complete the dashboard-only steps (SMTP for the OTP email, OTP length, the
  auth hook wiring) documented in [`supabase/DASHBOARD-SETUP.md`](supabase/DASHBOARD-SETUP.md).

> **Gotcha:** this project has Supabase's "auto-expose new tables" turned off,
> so every new table needs an explicit `grant` **in addition to** its RLS
> policies. RLS gates rows; the grant gates table access.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Project structure

```
app/                     App Router pages
  page.tsx               Homepage — search, category chips, listings grid
  listings/[id]/         Listing detail + edit
  new/                   Create a listing
  my-listings/           A seller's items + status controls
  join/  welcome/  settings/   Auth + onboarding + profile
  guidelines/  how-it-works/   Static content pages
components/site/         App components (nav, cards, forms, modal, gallery…)
components/ui/           Low-level primitives (button)
lib/                     Types, queries, search, image processing, helpers
  supabase/              Browser + server Supabase clients
supabase/                SQL migrations + dashboard setup notes
docs/                    Plan, decision log, mockup, and the test log
proxy.ts                 Session refresher (Next 16's renamed middleware)
```

## Key concepts

- **Auth = passwordless OTP + a domain allow-list.** A Postgres `before-user-created`
  hook checks the email domain against an `approved_email_domains` table, so
  adding a campus later is a data change, not a code change.
- **Identity is a chosen display name**, not the login. The J-number (email local
  part) is private by default and only shown publicly if a student explicitly
  picks it as their display name; sellers choose how they appear at `/welcome`.
- **Contact is snapshotted onto each listing** (Instagram / GroupMe). The school
  email is verification-only and never shown to buyers. Profiles are readable
  only by their owner.
- **Listing status:** available (shown, contactable) → reserved (shown, no
  contact) → sold (leaves the public board, kept in My Listings as history).
- **Trust & safety:** a prohibited-items policy shown at listing time, plus a
  Report flow (`reports` table) so bad content surfaces without live moderation.

## Docs

Living documents in [`docs/`](docs/):

- [`plan.md`](docs/plan.md) — what we're building and why
- [`decisions.md`](docs/decisions.md) — the decision log (what was considered and rejected)
- [`TESTING.md`](docs/TESTING.md) — the manual test checklist + deploy log
- [`mockup.html`](docs/mockup.html) — the visual source of truth

## Deployment

Hosted on Vercel; every push to `main` triggers a production deploy. The
Supabase env vars above must be set in Vercel (Production + Preview) or the build
fails, since the app reads from Supabase at request time.

---

<sub>Note: `AGENTS.md` in this repo is generated by `next dev` and pins guidance
about this Next.js version — leave it in place.</sub>
