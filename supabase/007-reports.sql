-- ============================================================================
-- Reports — let verified students flag listings that break the guidelines.
-- Run in the Supabase SQL editor. Re-runnable.
--
-- The point: bad content (banned items, scams, offensive posts) surfaces
-- without anyone moderating 24/7. A student clicks "Report", the row lands
-- here, and you review reports in the Supabase dashboard.
--
-- Trust model: reporting requires a session, and signup is gated to approved
-- .edu domains — so every report is tied to a verified student (accountable,
-- not anonymous spam). The seller is never told who reported them.
-- ============================================================================

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  -- Which listing was reported. If the listing is deleted, its reports go too.
  listing_id uuid not null references public.listings (id) on delete cascade,
  -- Who reported it. Must match the signed-in user (enforced by RLS below).
  reporter_id uuid not null references auth.users (id) on delete cascade,
  -- A short category the reporter picked, plus optional free-text context.
  reason text not null,
  details text,
  -- Your triage state as you work through reports in the dashboard.
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now(),
  -- One report per person per listing — a student can't spam-report the same
  -- item. (A repeat attempt is caught in the app and shown as "already reported".)
  unique (listing_id, reporter_id)
);

-- RLS gates ROWS; the GRANT gates table access. This project has "auto-expose
-- new tables" OFF, so BOTH are required — a missing grant = "permission denied".
alter table public.reports enable row level security;

grant insert on public.reports to authenticated;

-- A signed-in student may file a report only under their own id. There is
-- deliberately NO select/update/delete policy for regular users: nobody reads
-- reports through the app. You review them in the dashboard, where the
-- service_role bypasses RLS.
drop policy if exists "reports insertable by self" on public.reports;

create policy "reports insertable by self"
  on public.reports
  for insert
  to authenticated
  with check (auth.uid() = reporter_id);
