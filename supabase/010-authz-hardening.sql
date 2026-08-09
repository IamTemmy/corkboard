-- ============================================================================
-- Authorization hardening — make the DATABASE enforce what the UI assumes, so a
-- knowledgeable authenticated student can't do more by talking to Supabase
-- directly than the app allows. Run in the SQL editor. Re-runnable.
--
-- Pairs with app changes: lib/queries.ts getListingContact() now calls the
-- get_listing_contact() RPC below instead of selecting the contact column.
-- Run this migration and deploy together (contact stays hidden in the gap).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Contact readable only via a gated RPC (not by direct column SELECT).
--    008 stopped anon; this stops authenticated bulk-harvesting too. Contact is
--    returned one listing at a time, and only while the listing is available.
-- ----------------------------------------------------------------------------
revoke select on public.listings from authenticated;
grant select (
  id, created_at, title, description, category, condition, price,
  images, seller, campus, meetup_spot, status, seller_id, sold_at
) on public.listings to authenticated;

create or replace function public.get_listing_contact(p_listing_id uuid)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select contact
  from public.listings
  where id = p_listing_id
    and status = 'available';
$$;

revoke execute on function public.get_listing_contact(uuid) from anon, public;
grant execute on function public.get_listing_contact(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 2. Server-derive the trusted listing fields, on every insert AND update, so
--    identity/time/status can't be spoofed via the API. RLS proves ownership;
--    this proves the *displayed* identity. (Also fixes the campus:"JSU"
--    hardcode — campus now comes from the seller's profile.)
-- ----------------------------------------------------------------------------
create or replace function public.enforce_listing_trusted_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name   text;
  v_campus text;
begin
  select display_name, campus into v_name, v_campus
  from public.profiles
  where id = auth.uid();

  new.seller_id := auth.uid();               -- owner is always the caller
  new.seller    := coalesce(v_name, new.seller);   -- name comes from the profile
  new.campus    := coalesce(v_campus, new.campus); -- campus comes from the profile

  if tg_op = 'INSERT' then
    new.created_at := now();      -- can't backdate or future-pin to the top
    new.status     := 'available';
    new.sold_at    := null;
  else
    new.created_at := old.created_at;  -- immutable after creation
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_listing_trusted_fields on public.listings;
create trigger enforce_listing_trusted_fields
  before insert or update on public.listings
  for each row execute function public.enforce_listing_trusted_fields();

-- Curated meetup spots are part of the safety model — constrain them like
-- category. NOT VALID so existing rows aren't re-checked.
alter table public.listings drop constraint if exists listings_meetup_spot_valid;
alter table public.listings
  add constraint listings_meetup_spot_valid
  check (meetup_spot = any (array[
    'Student Center', 'Library', 'Walter Payton Center', 'Student Plaza'
  ])) not valid;

-- ----------------------------------------------------------------------------
-- 3. Profiles: the browser may change only display name + contact, never the
--    system fields (email/campus/user_type/created_at). RLS already limits it to
--    your own row; this limits WHICH COLUMNS.
-- ----------------------------------------------------------------------------
revoke update on public.profiles from authenticated;
grant update (display_name, instagram, groupme) on public.profiles to authenticated;

-- ----------------------------------------------------------------------------
-- 4. Reports: make the DB agree with the form. A report must be filed as 'open'
--    by someone who isn't the listing owner, with a known reason and bounded
--    details. (Duplicate prevention + insert-own-only already exist.)
-- ----------------------------------------------------------------------------
alter table public.reports drop constraint if exists reports_reason_valid;
alter table public.reports
  add constraint reports_reason_valid
  check (reason = any (array[
    'Prohibited item (weapon, drug, alcohol, etc.)',
    'Stolen or counterfeit goods',
    'Looks like a scam',
    'Offensive or inappropriate',
    'Spam or duplicate',
    'Something else'
  ])) not valid;

alter table public.reports drop constraint if exists reports_details_len;
alter table public.reports
  add constraint reports_details_len
  check (details is null or char_length(details) <= 400) not valid;

drop policy if exists "reports insertable by self" on public.reports;
create policy "reports insertable by self"
  on public.reports for insert to authenticated
  with check (
    auth.uid() = reporter_id
    and status = 'open'
    -- can't report your own listing (is-distinct-from handles demo rows whose
    -- seller_id is null — those stay reportable)
    and (select seller_id from public.listings where id = listing_id)
        is distinct from auth.uid()
  );

-- ----------------------------------------------------------------------------
-- 5. Auth hook: a signup with no email should be REJECTED, not allowed. Guards
--    against another auth provider (or anonymous auth) being enabled later.
-- ----------------------------------------------------------------------------
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
        'Corkboard is currently limited to Jackson State students. ' ||
        'Please sign up with your @students.jsums.edu email address.'
    )
  );
end;
$$;

grant execute on function public.hook_restrict_signup_by_email_domain(jsonb)
  to supabase_auth_admin;
revoke execute on function public.hook_restrict_signup_by_email_domain(jsonb)
  from authenticated, anon, public;
