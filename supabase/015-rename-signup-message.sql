-- 015 — Rebrand the signup-rejection message: "Corkboard" → "Snaggboard".
--
-- The before-user-created auth hook (last defined in 010) returns this message
-- when someone tries to sign up with a non-approved email domain. Its text
-- still said "Corkboard", so a friend who entered a Gmail saw the old name.
-- This redefines the function identically except for the product name.
--
-- USER MUST RUN this in the Supabase SQL editor (migrations are not auto-applied).
-- Safe / idempotent: create-or-replace preserves existing grants.

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

  -- No email = can't be a verified school account. Reject.
  if v_email is null then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'A school email address is required to sign up.'
      )
    );
  end if;

  v_domain := split_part(v_email, '@', 2);

  if exists (
    select 1 from public.approved_email_domains
    where domain = v_domain and enabled = true
  ) then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message',
        'Snaggboard is currently limited to Jackson State students. ' ||
        'Please sign up with your @students.jsums.edu email address.'
    )
  );
end;
$$;

grant execute on function public.hook_restrict_signup_by_email_domain(jsonb)
  to supabase_auth_admin;
revoke execute on function public.hook_restrict_signup_by_email_domain(jsonb)
  from authenticated, anon, public;
