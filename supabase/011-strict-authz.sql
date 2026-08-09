-- ============================================================================
-- Tighten the authorization rules added in 010. Run in the SQL editor.
-- Re-runnable. (Run this after 010.)
--
--   1. The trusted-fields trigger no longer falls back to client-supplied
--      seller/campus — it uses the profile's values and REJECTS the write if the
--      seller hasn't onboarded. Service-role/admin writes (no auth.uid) are left
--      alone so dashboard edits still work.
--   2. DB invariants the form assumed but didn't enforce: an *available* listing
--      must have at least one contact channel, and every listing must have 1–5
--      images.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Strict trusted-field derivation.
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
  -- No authenticated user = a service-role/admin operation (dashboard, seeding).
  -- Those are trusted; only constrain real authenticated users.
  if auth.uid() is null then
    return new;
  end if;

  select display_name, campus into v_name, v_campus
  from public.profiles
  where id = auth.uid();

  -- Identity is taken from the profile, never the client. If the seller hasn't
  -- finished onboarding (no display name) or has no campus, refuse — the app
  -- redirects to /welcome first, and this makes bypassing the app irrelevant.
  if v_name is null or v_campus is null then
    raise exception
      'Finish setting up your profile before posting a listing'
      using errcode = 'check_violation';
  end if;

  new.seller_id := auth.uid();
  new.seller    := v_name;      -- no coalesce: profile value is authoritative
  new.campus    := v_campus;

  if tg_op = 'INSERT' then
    new.created_at := now();
    new.status     := 'available';
    new.sold_at    := null;
  else
    new.created_at := old.created_at;
  end if;

  return new;
end;
$$;
-- (The trigger binding from 010 stays; replacing the function is enough.)

-- ----------------------------------------------------------------------------
-- 2. Marketplace invariants (NOT VALID: enforce new writes, skip old rows).
-- ----------------------------------------------------------------------------

-- An available listing must be contactable (Instagram or GroupMe present).
-- Reserved/sold may have empty contact.
alter table public.listings drop constraint if exists listings_available_has_contact;
alter table public.listings
  add constraint listings_available_has_contact
  check (
    status <> 'available'
    or contact ? 'instagram'
    or contact ? 'groupme'
  ) not valid;

-- Every listing has 1–5 images. coalesce handles an empty array ({} → length
-- null → 0), so [] is rejected too.
alter table public.listings drop constraint if exists listings_image_count;
alter table public.listings
  add constraint listings_image_count
  check (coalesce(array_length(images, 1), 0) between 1 and 5) not valid;
