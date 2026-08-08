-- ============================================================================
-- Lock the profiles table down to "you can only read your own row."
-- Run in the Supabase SQL editor.
--
-- Before: any signed-in student could SELECT every profile row — i.e. read every
-- student's email/Instagram in one query (a harvesting risk). The listing page
-- used that to show a seller's contact.
--
-- Now: a listing carries its own contact SNAPSHOT (Instagram/GroupMe) and the
-- seller's display name, so nothing needs to read another user's profile. So we
-- restrict profile SELECT to the owner. Email lives on the profile for sign-in
-- only and is never exposed to anyone else.
-- ============================================================================

drop policy if exists "profiles viewable by authenticated" on public.profiles;
drop policy if exists "profiles viewable by self" on public.profiles;

create policy "profiles viewable by self"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);
