-- ============================================================================
-- Tighten the "available listing must be contactable" invariant from 011.
-- Run in the SQL editor after 011. Re-runnable.
--
-- 011 checked that a contact KEY exists (contact ? 'instagram'). But
-- {"instagram": ""} has the key yet no usable channel — the UI would show
-- nothing. Check the VALUE instead: at least one non-blank channel.
-- ============================================================================

alter table public.listings drop constraint if exists listings_available_has_contact;
alter table public.listings
  add constraint listings_available_has_contact
  check (
    status <> 'available'
    or nullif(btrim(contact ->> 'instagram'), '') is not null
    or nullif(btrim(contact ->> 'groupme'),   '') is not null
  ) not valid;
