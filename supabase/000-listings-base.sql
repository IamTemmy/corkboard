-- ============================================================================
-- 000 — Base `listings` table (retro-captured from the live database).
-- Run in the Supabase SQL editor. Re-runnable / idempotent.
--
-- WHY THIS EXISTS
-- The listings table was created in the Supabase dashboard before migrations
-- were version-controlled (the numbered migrations start at 002). As a result
-- the table itself, its RLS-enabled state, the public SELECT policy, and the
-- `status` CHECK lived ONLY inside the live database — they could not be audited
-- or rebuilt from source. Migrations 004/008 even say "SELECT is already public"
-- and "SELECT was already granted", referring to state that was never captured.
-- This file captures exactly that missing base so the whole security model is
-- provable from source and a from-scratch rebuild is correct.
--
-- SAFETY
-- On the EXISTING production database this is a complete no-op:
--   * `create table if not exists` — table already exists → skipped.
--   * `enable row level security`  — already on → idempotent, no error.
--   * the SELECT policy and the CHECK are each guarded by an existence test,
--     so nothing is dropped or recreated.
-- On a FROM-SCRATCH rebuild it recreates the table exactly; later migrations
-- layer on top via their own guards (004 adds seller_id + own-row policies with
-- `if not exists`, 005 adds sold_at `if not exists`, 008 sets the anon/auth
-- column grants, 009–012 add the NOT VALID hardening CHECKs). Run this FIRST,
-- before 002. Verified against information_schema on 2026-08-10.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. The table — full current shape, matching the live schema column-for-column.
-- ----------------------------------------------------------------------------
create table if not exists public.listings (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz not null    default now(),
  title       text        not null,
  description text,
  category    text        not null,
  condition   text,
  price       integer     not null    default 0,
  images      text[]      not null    default '{}'::text[],
  seller      text        not null,
  campus      text        not null    default 'JSU',
  meetup_spot text        not null,
  contact     jsonb       not null    default '{}'::jsonb,
  status      text        not null    default 'available',
  -- Owner of the listing. Nullable so demo/seed rows can exist unowned; every
  -- real listing gets seller_id stamped from the caller by the trusted-field
  -- trigger. ON DELETE SET NULL keeps a sold-history row if the account is gone.
  seller_id   uuid        references auth.users(id) on delete set null,
  sold_at     timestamptz
);

-- ----------------------------------------------------------------------------
-- 2. Row Level Security ON.  LOAD-BEARING: migration 004 grants table-wide
--    INSERT/UPDATE/DELETE to `authenticated`, which is only safe because RLS +
--    the own-row policies gate it. If RLS were ever off, any signed-in student
--    could edit or delete ANY listing. (Enabling is idempotent — safe if on.)
-- ----------------------------------------------------------------------------
alter table public.listings enable row level security;

-- ----------------------------------------------------------------------------
-- 3. Public read policy.  Product listings are meant to be browsable by anyone,
--    signed in or not. The sensitive `contact` column is separately protected at
--    the GRANT level (migration 008 revokes it from anon), so even `select *`
--    can't leak contact. Guarded so it never disturbs the existing live policy.
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'listings'
      and policyname = 'Anyone can view listings'
  ) then
    create policy "Anyone can view listings"
      on public.listings for select
      using (true);
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 4. `status` is a fixed lifecycle: available → reserved → sold (and relist).
--    This CHECK is VALID (enforced on existing rows), unlike the later NOT VALID
--    hardening constraints. Guarded so re-running never errors on a dup name.
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.listings'::regclass
      and conname  = 'listings_status_check'
  ) then
    alter table public.listings
      add constraint listings_status_check
      check (status = any (array['available'::text, 'reserved'::text, 'sold'::text]));
  end if;
end $$;
