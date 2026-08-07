-- ============================================================================
-- Fix: grant the authenticated role table privileges on profiles
-- Run this in the Supabase SQL editor.
--
-- Why: this project has "auto-expose new tables" turned OFF, so a new table
-- grants no access to the authenticated/anon roles until we say so. profiles got
-- its RLS policies but not the underlying GRANT — so signed-in users couldn't
-- read or update their own profile ("Couldn't save that"). RLS still gates which
-- ROWS you can touch; this grants the table-level capability the policies gate.
-- anon is intentionally excluded — profiles are not public.
-- ============================================================================

grant select, insert, update on table public.profiles to authenticated;
