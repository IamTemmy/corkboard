-- ============================================================================
-- Make seller contact a PRIVACY rule at the database, not just in the UI.
-- Run in the Supabase SQL editor. Re-runnable.
--
-- Problem: listings has a public SELECT policy + an anon grant on ALL columns,
-- and the seller's contact (Instagram/GroupMe) lives in listings.contact. So a
-- signed-out visitor — or anyone with the public anon key querying Supabase
-- directly — could read contact, defeating "only verified students can contact
-- sellers."
--
-- Fix: COLUMN-LEVEL privileges. The anon role may read every listing column
-- EXCEPT contact; the authenticated (verified student) role keeps full access.
-- The app selects columns explicitly and fetches contact separately, only for
-- signed-in users (see lib/queries.ts getListingContact).
-- ============================================================================

-- Drop the blanket anon SELECT, then grant it back on all columns but contact.
revoke select on public.listings from anon;

grant select (
  id,
  created_at,
  title,
  description,
  category,
  condition,
  price,
  images,
  seller,
  campus,
  meetup_spot,
  status,
  seller_id,
  sold_at
) on public.listings to anon;

-- Verified students can read the whole row, including contact.
grant select on public.listings to authenticated;

-- Note: RLS still governs which ROWS are visible (the public-select policy is
-- unchanged). This adds COLUMN control on top — rows public, contact gated.
