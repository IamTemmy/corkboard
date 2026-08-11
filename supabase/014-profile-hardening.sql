-- ============================================================================
-- 014 — Profile field hardening (database is the authority).
-- Run in the Supabase SQL editor. Idempotent / re-runnable.
--
-- Three defense-in-depth gaps a direct API caller (bypassing the UI) could hit:
--   #3  A display name could impersonate a campus office/official
--       ("Campus Police", "JSU Housing", "Corkboard Admin"). The client now
--       blocks this (lib/display-name.ts), but the client is bypassable — so
--       enforce it here too. Verification proves control of a campus email,
--       NOT identity or school endorsement (see docs/decisions.md).
--   #7  display_name / instagram / groupme had NO length bound at the DB (only
--       a client maxLength). A raw call could store huge strings, which then
--       get snapshotted onto listings.seller.
--   #6  `authenticated` held a table-wide INSERT on profiles. The signup
--       trigger (handle_new_user, SECURITY DEFINER) is the only thing that
--       should create a profile; the client only ever UPDATEs. Revoke INSERT so
--       a user can't hand-craft a first profile row with attacker-chosen
--       system fields (campus/user_type/email) in the edge case one is missing.
--
-- NOTE: the reserved-term regex below must stay in sync with the list in
-- lib/display-name.ts.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- #3 + #7 — validate profile fields on every insert/update.
-- A trigger (not a CHECK) so we can give clear error messages and only guard
-- NEW writes — existing rows are untouched.
-- ----------------------------------------------------------------------------
create or replace function public.enforce_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Length bounds (mirrors the client caps; the DB is the real authority).
  if new.display_name is not null and char_length(new.display_name) > 30 then
    raise exception 'display_name must be 30 characters or fewer';
  end if;
  if new.instagram is not null and char_length(new.instagram) > 30 then
    raise exception 'instagram handle must be 30 characters or fewer';
  end if;
  if new.groupme is not null and char_length(new.groupme) > 200 then
    raise exception 'groupme link must be 200 characters or fewer';
  end if;

  -- Reserved-identity guard: no impersonating a campus office/official.
  -- \m…\M are Postgres word boundaries; ~* is case-insensitive.
  if new.display_name is not null and new.display_name ~*
     '\m(corkboard|jsu|jackson state|campus police|campus security|police|housing|financial aid|registrar|bookstore|help ?desk|it support|admin|administrator|official|moderator|faculty|professor|provost|dean of|university|support team|customer support)\M'
  then
    raise exception 'display_name may not impersonate a campus office or official';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_profile_fields on public.profiles;
create trigger trg_enforce_profile_fields
  before insert or update on public.profiles
  for each row execute function public.enforce_profile_fields();

-- ----------------------------------------------------------------------------
-- #6 — profile creation belongs to the signup trigger, not the client.
-- handle_new_user is SECURITY DEFINER, so it still creates rows after this.
-- ----------------------------------------------------------------------------
revoke insert on table public.profiles from authenticated;
drop policy if exists "users insert own profile" on public.profiles;
