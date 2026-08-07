-- ============================================================================
-- Listing creation: link listings to accounts, move contact onto the profile,
-- add a storage bucket for photos. Run in the Supabase SQL editor.
-- Re-runnable (if-not-exists / create-or-replace / on-conflict throughout).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Profiles carry the seller's contact (contact belongs to the person).
-- ----------------------------------------------------------------------------
alter table public.profiles add column if not exists email     text; -- from account
alter table public.profiles add column if not exists instagram text; -- bare handle, no @/url
alter table public.profiles add column if not exists groupme   text; -- join link

-- Backfill email for profiles that predate this column.
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

-- New signups: copy the verified account email onto the profile so listings can
-- show it as the guaranteed contact channel without touching the auth schema.
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

  insert into public.profiles (id, display_name, email, campus, user_type)
  values (new.id, null, new.email, v_campus, coalesce(v_user_type, 'student'));

  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 2. Listings belong to an account.
-- ----------------------------------------------------------------------------
-- The existing free-text `seller` column stays as a name SNAPSHOT (rarely
-- changes, keeps the public "Listed by …" simple). seller_id is the real owner.
alter table public.listings
  add column if not exists seller_id uuid references auth.users(id) on delete set null;

-- RLS: SELECT is already public. A signed-in student may create listings as
-- themselves, and edit/delete only their own.
drop policy if exists "users insert own listings" on public.listings;
create policy "users insert own listings"
  on public.listings for insert to authenticated
  with check (auth.uid() = seller_id);

drop policy if exists "users update own listings" on public.listings;
create policy "users update own listings"
  on public.listings for update to authenticated
  using (auth.uid() = seller_id) with check (auth.uid() = seller_id);

drop policy if exists "users delete own listings" on public.listings;
create policy "users delete own listings"
  on public.listings for delete to authenticated
  using (auth.uid() = seller_id);

-- The GRANT (auto-expose is off, so RLS policies alone aren't enough — the role
-- needs the table privilege the policies gate). SELECT was already granted.
grant insert, update, delete on table public.listings to authenticated;

-- ----------------------------------------------------------------------------
-- 3. Storage bucket for listing photos (public read; students write their own).
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

-- Anyone can view listing photos (they're public product images).
drop policy if exists "listing images are readable" on storage.objects;
create policy "listing images are readable"
  on storage.objects for select to public
  using (bucket_id = 'listing-images');

-- A student may upload only into their own folder (path = <user id>/<file>).
drop policy if exists "students upload own listing images" on storage.objects;
create policy "students upload own listing images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "students update own listing images" on storage.objects;
create policy "students update own listing images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "students delete own listing images" on storage.objects;
create policy "students delete own listing images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
