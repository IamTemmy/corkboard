-- ============================================================================
-- Record WHEN a listing was marked sold. Run in the Supabase SQL editor.
--
-- Sold listings leave the public board (query change lives in the app), but we
-- stamp the sale time so a "Recently sold" social-proof strip is a trivial add
-- later, once there's real sold volume worth showing. Null = not sold.
-- ============================================================================

alter table public.listings add column if not exists sold_at timestamptz;
