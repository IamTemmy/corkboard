-- Corkboard authorization check — run in the Supabase SQL editor.
-- Simulates a signed-in student ("attacker") using JWT claims + `set role`, and
-- confirms the database rejects hostile actions. Returns a results table (the
-- editor doesn't display RAISE NOTICE). Safe: it self-cleans and keeps no data.
--
-- The attacker is any onboarded user; the "victim" is a listing they don't own
-- (demo rows have seller_id null). This proves RLS/trigger/CHECK rules without a
-- second real login. Re-run the same scenarios with two real accounts (Path A
-- in docs/TESTING.md) once a Resend domain makes a second sign-in possible.

drop table if exists _authz;
create temp table _authz(line text);

do $$
declare
  v_me uuid; v_victim uuid; v_rows int; v_seller text; v_id uuid;
  v_out text[] := '{}';
begin
  select id into v_me from public.profiles where display_name is not null limit 1;
  select id into v_victim from public.listings where seller_id is distinct from v_me limit 1;

  perform set_config('request.jwt.claims',
    json_build_object('sub', v_me, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  -- 1. Edit someone else's listing → RLS blocks (0 rows; value is a no-op anyway).
  update public.listings set title = title where id = v_victim;
  get diagnostics v_rows = row_count;
  v_out := array_append(v_out, '1 edit others listing  : ' || case when v_rows=0 then 'BLOCKED ok' else 'CHANGED '||v_rows||' FAIL' end);

  -- 2. Delete someone else's listing → RLS blocks (0 rows).
  delete from public.listings where id = v_victim;
  get diagnostics v_rows = row_count;
  v_out := array_append(v_out, '2 delete others listing: ' || case when v_rows=0 then 'BLOCKED ok' else 'DELETED '||v_rows||' FAIL' end);

  -- 3. Read another user's profile → self-only (0 rows).
  select count(*) into v_rows from public.profiles where id <> v_me;
  v_out := array_append(v_out, '3 read others profiles : ' || case when v_rows=0 then 'BLOCKED ok' else v_rows||' visible FAIL' end);

  -- 4. Spoof seller/campus → trigger overrides to the caller's profile.
  begin
    insert into public.listings (title,description,category,condition,price,images,meetup_spot,contact,seller,campus,status)
    values ('_atk','x','Electronics','New',5,array['a'],'Library','{"instagram":"x"}'::jsonb,'JSU Admin','Harvard','available')
    returning id, seller into v_id, v_seller;
    v_out := array_append(v_out, '4 spoof seller name    : ' || case when v_seller<>'JSU Admin' then 'overridden to "'||v_seller||'" ok' else 'SPOOFED FAIL' end);
    delete from public.listings where id = v_id;
  exception when others then v_out := array_append(v_out, '4 spoof seller name    : insert error '||sqlerrm); end;

  -- 5. Invalid meetup spot → CHECK blocks.
  begin
    insert into public.listings (title,description,category,condition,price,images,meetup_spot,contact)
    values ('_atk','x','Electronics','New',5,array['a'],'My apartment','{"instagram":"x"}'::jsonb) returning id into v_id;
    v_out := array_append(v_out, '5 invalid meetup spot  : ALLOWED FAIL'); delete from public.listings where id=v_id;
  exception when others then v_out := array_append(v_out, '5 invalid meetup spot  : BLOCKED ok'); end;

  -- 6. Available listing with no usable contact → CHECK blocks.
  begin
    insert into public.listings (title,description,category,condition,price,images,meetup_spot,contact)
    values ('_atk','x','Electronics','New',5,array['a'],'Library','{}'::jsonb) returning id into v_id;
    v_out := array_append(v_out, '6 available no contact : ALLOWED FAIL'); delete from public.listings where id=v_id;
  exception when others then v_out := array_append(v_out, '6 available no contact : BLOCKED ok'); end;

  -- 7. Zero images → CHECK blocks.
  begin
    insert into public.listings (title,description,category,condition,price,images,meetup_spot,contact)
    values ('_atk','x','Electronics','New',5,array[]::text[],'Library','{"instagram":"x"}'::jsonb) returning id into v_id;
    v_out := array_append(v_out, '7 zero images          : ALLOWED FAIL'); delete from public.listings where id=v_id;
  exception when others then v_out := array_append(v_out, '7 zero images          : BLOCKED ok'); end;

  -- 8. Six images (over the max) → CHECK blocks.
  begin
    insert into public.listings (title,description,category,condition,price,images,meetup_spot,contact)
    values ('_atk','x','Electronics','New',5,array['a','b','c','d','e','f'],'Library','{"instagram":"x"}'::jsonb) returning id into v_id;
    v_out := array_append(v_out, '8 six images           : ALLOWED FAIL'); delete from public.listings where id=v_id;
  exception when others then v_out := array_append(v_out, '8 six images           : BLOCKED ok'); end;

  execute 'reset role';
  insert into _authz select unnest(v_out);
end $$;

select * from _authz;
drop table _authz;
