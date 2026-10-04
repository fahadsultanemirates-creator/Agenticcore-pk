-- Telegram orders (pk_0006) and Telegram enquiries (Estate 0021) — run on a LOCAL
-- database built from every Estate + PK migration (never production).
\set ON_ERROR_STOP 1
create or replace function pg_temp.as_user(uid text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, false) $$;
create or replace function pg_temp.as_service() returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, false) $$;
create or replace function pg_temp.no_jwt() returns void language sql as $$
  select set_config('request.jwt.claims', '{}', false) $$;
grant execute on function pg_temp.as_user(text) to anon, authenticated;

insert into auth.users (id, email, encrypted_password, raw_user_meta_data) values
 ('d0000000-0000-0000-0000-000000000001', 'client@x.pk', extensions.crypt('Pass-1', extensions.gen_salt('bf')), '{"full_name":"Client One","phone":"03221111111"}'),
 ('d0000000-0000-0000-0000-000000000002', 'other@x.pk', extensions.crypt('Pass-2', extensions.gen_salt('bf')), '{"full_name":"Other","phone":"03222222222"}');
insert into public.listings (id, owner_id, title, type, property_type, city, area, price) values
 ('d0000000-0000-0000-0000-0000000000b1', 'd0000000-0000-0000-0000-000000000002', 'Other House', 'buy', 'house', 'Islamabad', 'G-13', 30000000);

-- 1. the server places an order for the identified client
select pg_temp.as_service();
create temp table t1 as select * from public.pk_tg_place_order('d0000000-0000-0000-0000-000000000001', '[{"line_id":"p-wa-card","quantity":2}]'::jsonb);
select pg_temp.no_jwt();
do $t$ declare t public.pk_tasks; begin
  select * into t from public.pk_tasks where id = (select task_id from t1);
  if t.client_id <> 'd0000000-0000-0000-0000-000000000001' or t.source <> 'telegram' or t.quantity <> 2 or t.amount <> 2 * t.unit_price then raise exception 'FAIL order row %', row_to_json(t); end if;
  if t.public_id !~ '^ACPK-' or t.status <> 'waiting_on_you' then raise exception 'FAIL task id/status'; end if;
  if not exists (select 1 from public.pk_invoices where task_id = t.id) then raise exception 'FAIL invoice'; end if;
  raise notice 'ok  1 server places a Telegram order for the identified client (ACPK id, price from the catalogue, invoice)';
end $t$;

-- 2. details and attachments as that client; attachments must sit in the client's own folder
select pg_temp.as_service();
select public.pk_tg_client('d0000000-0000-0000-0000-000000000001', 'details', (select task_id from t1), 'Brief: 2 cards for my G-13 house', '{"brief":"2 cards"}'::jsonb);
select public.pk_tg_client('d0000000-0000-0000-0000-000000000001', 'attach', (select task_id from t1), null, null, 'd0000000-0000-0000-0000-000000000001/tg/1.jpg', 'photo 1');
do $t$ begin
  begin
    perform public.pk_tg_client('d0000000-0000-0000-0000-000000000001', 'attach', (select task_id from t1), null, null, 'd0000000-0000-0000-0000-000000000002/x.jpg', 'x');
    raise exception 'FAIL attachment in someone else''s folder accepted';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
  begin
    perform public.pk_tg_client('d0000000-0000-0000-0000-000000000002', 'details', (select task_id from t1), 'hijack', '{}'::jsonb);
    raise exception 'FAIL another client could change the order';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
  begin
    perform public.pk_tg_place_order('d0000000-0000-0000-0000-000000000001', '[{"line_id":"p-wa-card","quantity":1,"details":{"estate_listing_id":"d0000000-0000-0000-0000-0000000000b1"}}]'::jsonb);
    raise exception 'FAIL order could reference someone else''s Estate listing';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
end $t$;
select pg_temp.no_jwt();
do $t$ begin
  if (select details ->> 'brief' from public.pk_tasks where id = (select task_id from t1)) <> '2 cards' then raise exception 'FAIL details'; end if;
  if (select count(*) from public.pk_attachments where task_id = (select task_id from t1)) <> 1 then raise exception 'FAIL attachment count'; end if;
  raise notice 'ok  2 details/attachments as the client; other folders, other clients and other people''s listings refused';
end $t$;

-- 3. owner approval through the server: confirm, deliver, client approves
select pg_temp.as_service();
select public.pk_admin_set_status((select task_id from t1), 'confirmed', 'Confirmed by the team');
select public.pk_admin_set_status((select task_id from t1), 'in_progress', null);
insert into public.pk_work_jobs (task_id, worker, status) values ((select task_id from t1), 'grok_image', 'queued');
select public.pk_admin_add_deliverable((select task_id from t1), 'image', 'd0000000-0000-0000-0000-000000000001/x/1.jpg', null, 'Card 1', true);
select public.pk_tg_client('d0000000-0000-0000-0000-000000000001', 'approve', (select task_id from t1));
select pg_temp.no_jwt();
do $t$ begin
  if (select status from public.pk_tasks where id = (select task_id from t1)) <> 'delivered' then raise exception 'FAIL not delivered'; end if;
  if (select due_at from public.pk_tasks where id = (select task_id from t1)) is null then raise exception 'FAIL due date not set on confirm'; end if;
  raise notice 'ok  3 server-side owner actions (confirm, start, deliver) and client approval';
end $t$;

-- 4. members and visitors cannot use the server functions or the work queue
select pg_temp.as_user('d0000000-0000-0000-0000-000000000001');
set role authenticated;
do $t$ begin
  begin perform public.pk_tg_place_order('d0000000-0000-0000-0000-000000000002', '[{"line_id":"p-wa-card"}]'::jsonb); raise exception 'FAIL member called pk_tg_place_order';
  exception when insufficient_privilege then null; end;
  begin perform public.pk_admin_set_status((select task_id from t1), 'cancelled', null); raise exception 'FAIL member used an admin RPC';
  exception when insufficient_privilege then null; end;
  if (select count(*) from public.pk_work_jobs) <> 0 then raise exception 'FAIL work jobs visible to a member'; end if;
  begin perform public.send_enquiry_as('d0000000-0000-0000-0000-000000000002', 'listing', 'd0000000-0000-0000-0000-0000000000b1', 'hello there'); raise exception 'FAIL member called send_enquiry_as';
  exception when insufficient_privilege then null; end;
  raise notice 'ok  4 server functions, admin RPCs and the work queue closed to members';
end $t$;
reset role;

-- 5. Telegram enquiries run send_enquiry's own rules as the sender
select pg_temp.as_service();
do $t$ declare e uuid; begin
  e := public.send_enquiry_as('d0000000-0000-0000-0000-000000000001', 'listing', 'd0000000-0000-0000-0000-0000000000b1', 'Is the G-13 house still available?');
  if not exists (select 1 from public.enquiries where id = e and sender_id = 'd0000000-0000-0000-0000-000000000001' and recipient_id = 'd0000000-0000-0000-0000-000000000002') then raise exception 'FAIL enquiry row'; end if;
  begin
    perform public.send_enquiry_as('d0000000-0000-0000-0000-000000000001', 'listing', '5a3b1e00-0000-4000-8000-000000000101', 'sample please');
    raise exception 'FAIL enquiry on a sample listing';
  exception when others then if sqlerrm like 'FAIL%' then raise; end if; end;
  raise notice 'ok  5 Telegram enquiry: sender identified by the server, sample listings refused';
end $t$;
