-- ============================================================================
-- Defense in depth: enforce the form's rules at the database, so a direct API
-- caller (bypassing the React UI) can't write junk. Run in the SQL editor.
-- Re-runnable (drop-if-exists before each add).
--
-- Constraints are added NOT VALID: they're enforced for all NEW/updated rows
-- but skip re-validating existing demo rows, so the migration can't fail on
-- pre-existing data. (Run `validate constraint` later once data is clean.)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Listing field constraints (mirror the form).
-- ----------------------------------------------------------------------------
alter table public.listings drop constraint if exists listings_price_nonneg;
alter table public.listings
  add constraint listings_price_nonneg check (price >= 0) not valid;

alter table public.listings drop constraint if exists listings_title_len;
alter table public.listings
  add constraint listings_title_len
  check (char_length(title) between 1 and 80) not valid;

alter table public.listings drop constraint if exists listings_description_len;
alter table public.listings
  add constraint listings_description_len
  check (description is null or char_length(description) <= 600) not valid;

alter table public.listings drop constraint if exists listings_category_valid;
alter table public.listings
  add constraint listings_category_valid
  check (category = any (array['Electronics','Clothing','Furniture','Books','Dorm']))
  not valid;

alter table public.listings drop constraint if exists listings_condition_valid;
alter table public.listings
  add constraint listings_condition_valid
  check (
    condition is null
    or condition = any (array['New','Like new','Good condition','Fair'])
  ) not valid;

-- (status already has a check constraint from the original table; left as-is.)

-- ----------------------------------------------------------------------------
-- 2. Storage bucket: only real image types, with a size ceiling. The app
--    already compresses to JPEG (~<1 MB) before upload, so 5 MB is generous
--    headroom while stopping a direct caller from dumping large/other files.
-- ----------------------------------------------------------------------------
update storage.buckets
set
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'],
  file_size_limit = 5242880 -- 5 MB
where id = 'listing-images';
