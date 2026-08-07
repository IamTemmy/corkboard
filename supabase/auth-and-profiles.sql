-- ============================================================================
-- Corkboard — .edu authentication + profiles
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Safe to re-run: it uses "if not exists" / "create or replace" throughout.
--
-- What this sets up:
--   1. approved_email_domains — the allow-list that decides who counts as a
--      "verified student". Domains live in a TABLE, not in code, so widening
--      access later (e.g. faculty) is a one-row change, not a redeploy.
--   2. A "before user created" auth hook that rejects any signup whose email
--      domain isn't in that table (and enabled). A gmail.com address bounces.
--   3. profiles — one row per real user, auto-created on signup by a trigger.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. approved_email_domains
-- ----------------------------------------------------------------------------
-- Each row = one email domain we trust, plus what kind of person it belongs to
-- and whether signups from it are currently turned on.
create table if not exists public.approved_email_domains (
  domain     text primary key,                       -- e.g. 'students.jsums.edu'
  campus     text not null,                           -- human-readable school name
  user_type  text not null default 'student',         -- 'student' | 'faculty_staff' | ...
  enabled    boolean not null default true,           -- is signup from this domain live?
  created_at timestamptz not null default now()
);

-- Seed: Jackson State students are live now; the faculty/staff domain is
-- present but DORMANT (enabled = false). To let faculty in later, you flip that
-- one boolean to true — no code change, no new deploy.
insert into public.approved_email_domains (domain, campus, user_type, enabled)
values
  ('students.jsums.edu', 'Jackson State University', 'student',       true),
  ('jsums.edu',          'Jackson State University', 'faculty_staff', false)
on conflict (domain) do nothing;

-- Row Level Security: this is config, not user data, and nobody in the browser
-- needs to read it. We enable RLS (so it is NOT exposed via the public API) and
-- grant read access only to the auth system, which needs it inside the hook.
alter table public.approved_email_domains enable row level security;

-- The auth hook runs as the role `supabase_auth_admin`. Without BOTH a grant and
-- an RLS policy, its SELECT returns zero rows and the hook would reject EVERYONE.
grant usage on schema public to supabase_auth_admin;
grant select on table public.approved_email_domains to supabase_auth_admin;

drop policy if exists "auth admin reads approved domains"
  on public.approved_email_domains;
create policy "auth admin reads approved domains"
  on public.approved_email_domains
  for select
  to supabase_auth_admin
  using (true);


-- ----------------------------------------------------------------------------
-- 2. The "before user created" auth hook
-- ----------------------------------------------------------------------------
-- Supabase calls this function with the pending signup as JSON, BEFORE the user
-- row is created. Return '{}' to allow; return an {"error": ...} object to block.
-- No SECURITY DEFINER (per Supabase guidance) — it runs as supabase_auth_admin,
-- which we granted table access above. search_path is pinned for safety.
create or replace function public.hook_restrict_signup_by_email_domain(event jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_email  text;
  v_domain text;
begin
  v_email := lower(event -> 'user' ->> 'email');

  -- No email on the signup (shouldn't happen for us) — nothing to check, allow.
  if v_email is null then
    return '{}'::jsonb;
  end if;

  v_domain := split_part(v_email, '@', 2);

  -- Is this domain in the allow-list AND currently enabled?
  if exists (
    select 1
    from public.approved_email_domains
    where domain = v_domain
      and enabled = true
  ) then
    return '{}'::jsonb;                 -- approved → let the signup proceed
  end if;

  -- Not approved → block with a friendly, honest message.
  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message',
        'Corkboard is currently limited to Jackson State students. ' ||
        'Please sign up with your @students.jsums.edu email address.'
    )
  );
end;
$$;

-- Let only the auth system run it; take it away from everyone else.
grant execute
  on function public.hook_restrict_signup_by_email_domain(jsonb)
  to supabase_auth_admin;
revoke execute
  on function public.hook_restrict_signup_by_email_domain(jsonb)
  from authenticated, anon, public;


-- ----------------------------------------------------------------------------
-- 3. profiles (+ auto-create on signup)
-- ----------------------------------------------------------------------------
-- One row per real user. Linked to auth.users; deleting the auth user deletes
-- the profile. campus/user_type are copied from the domain they signed up with,
-- so the profile can honestly say "verified JSU student" vs "faculty/staff".
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email        text,   -- copied from the account; the guaranteed contact channel
  instagram    text,   -- optional, bare handle (no @ / URL)
  groupme      text,   -- optional, join link
  campus       text,
  user_type    text not null default 'student',
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Signed-in users can view profiles (you should see who you're dealing with).
drop policy if exists "profiles viewable by authenticated" on public.profiles;
create policy "profiles viewable by authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- A user may create and edit ONLY their own profile row.
drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- RLS decides WHICH ROWS a role may touch; this GRANT decides whether the role
-- may touch the table at all. Auto-expose is off on this project, so without this
-- the policies above have nothing to gate and signed-in users get "permission
-- denied". (anon is intentionally excluded — profiles aren't public.)
grant select, insert, update on table public.profiles to authenticated;

-- When a new auth user is created, make their profile automatically. This runs
-- as the function owner (SECURITY DEFINER) so it can write past RLS — standard
-- Supabase pattern. search_path is pinned and every name is schema-qualified.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_domain    text;
  v_campus    text;
  v_user_type text;
begin
  v_domain := split_part(lower(new.email), '@', 2);

  select campus, user_type
    into v_campus, v_user_type
  from public.approved_email_domains
  where domain = v_domain;

  -- display_name is left NULL on purpose: the app prompts the student to choose
  -- how they want to appear ("Welcome" step), then fills it in. A NULL here means
  -- "hasn't chosen yet"; until they do, the UI falls back to their J-number.
  -- email is copied from the verified account — the guaranteed contact channel.
  insert into public.profiles (id, display_name, email, campus, user_type)
  values (
    new.id,
    null,
    new.email,
    v_campus,
    coalesce(v_user_type, 'student')
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
