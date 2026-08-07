-- ============================================================================
-- Migration: make display_name a chosen value, not an auto-filled J-number
-- Run this in the Supabase SQL editor (after auth-and-profiles.sql).
--
-- Why: a listing tied to an account should show a friendly, chosen name — never
-- the student's J-number (a semi-private student ID). So a new profile now starts
-- with display_name = NULL ("hasn't chosen"), and the app's /welcome step asks the
-- student how they want to appear (a preferred name, or their J-number by choice).
-- ============================================================================

-- 1. New signups get a NULL display_name (the app fills it in at /welcome).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_campus    text;
  v_user_type text;
begin
  select campus, user_type
    into v_campus, v_user_type
  from public.approved_email_domains
  where domain = split_part(lower(new.email), '@', 2);

  insert into public.profiles (id, display_name, campus, user_type)
  values (new.id, null, v_campus, coalesce(v_user_type, 'student'));

  return new;
end;
$$;

-- 2. Reset existing profiles that were auto-filled with a J-number, so those
--    accounts also get the "how would you like to appear?" step next sign-in.
--    (Safe now — there are no real users yet, just test accounts.)
update public.profiles set display_name = null where display_name is not null;
