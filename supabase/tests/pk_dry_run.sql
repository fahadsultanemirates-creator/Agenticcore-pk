-- Dry-run test for pk_0001 + pk_0002. Run it AFTER pasting both migration
-- files into the same transaction. It exercises the order -> pay ->
-- deliver -> revise -> approve flow and the 10% referral credit, then
-- ALWAYS raises an exception carrying the results, so nothing is ever
-- committed. Usage (psql or the Supabase SQL editor):
--   begin; \i pk_0001_init.sql \i pk_0002_seed_catalog.sql \i pk_dry_run.sql
do $$
declare
  referrer uuid;
  client uuid := gen_random_uuid();
  res jsonb := '{}'::jsonb;
  t public.pk_tasks;
  first_task uuid;
  inv public.pk_invoices;
  due_before timestamptz;
  n int;
  err text;
begin
  -- due-time rule
  res := res || jsonb_build_object(
    'due_1759_same_day', public.pk_compute_due('2026-09-27 17:59+05', 0),
    'due_1801_next_day', public.pk_compute_due('2026-09-27 18:01+05', 0),
    'due_2to3_days',     public.pk_compute_due('2026-09-27 10:00+05', 3),
    'due_scheduled',     public.pk_compute_due('2026-09-27 10:00+05', null),
    'id_format',         public.pk_format_id('ACPK-', 7) || ' / ' || public.pk_format_id('ACPK-', 12345));

  -- a temporary admin (the existing account) and a fresh client referred by it
  select id into referrer from public.profiles order by created_at limit 1;
  update public.profiles set role = 'admin' where id = referrer;
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, raw_user_meta_data, created_at, updated_at)
  values ('00000000-0000-0000-0000-000000000000', client, 'authenticated', 'authenticated', 'pk-dry-run@example.com', '',
          jsonb_build_object('full_name', 'Dry Run', 'phone', '+920000000001', 'role', 'agency',
                             'referral_code', (select referral_code from public.profiles where id = referrer)), now(), now());
  res := res || jsonb_build_object('client_referred_by_ok', (select referred_by = referrer from public.profiles where id = client));

  -- act as the client
  perform set_config('request.jwt.claims', json_build_object('sub', client, 'role', 'authenticated')::text, true);
  select count(*) into n from public.pk_place_order('[{"line_id":"4-dfy","quantity":2,"details":{"project":"Test Towers"}},{"line_id":"31-mo"}]'::jsonb);
  select * into t from public.pk_tasks where client_id = client order by public_id limit 1;
  first_task := t.id;
  select * into inv from public.pk_invoices where client_id = client order by number limit 1;
  res := res || jsonb_build_object('order_tasks', n, 'first_task', t.public_id, 'first_status', t.status, 'first_missing', t.missing,
                                   'order_invoice', inv.number, 'order_amount', inv.amount);

  begin perform public.pk_place_order('[{"line_id":"4-dfy","quantity":1}]'::jsonb); perform public.pk_request_changes(first_task, 'x');
  exception when others then err := sqlerrm; end;
  res := res || jsonb_build_object('changes_before_review_blocked', err);

  select count(*) into n from public.pk_buy_package('project-partner', true);
  res := res || jsonb_build_object(
    'pp_tasks', (select count(*) from public.pk_tasks where client_id = client and subscription_id is not null),
    'pp_invoice', (select amount from public.pk_invoices where client_id = client and subscription_id is not null));

  err := null;
  begin perform public.pk_admin_set_status(first_task, 'confirmed'); exception when others then err := sqlerrm; end;
  res := res || jsonb_build_object('client_cannot_admin', err);

  -- act as the admin
  perform set_config('request.jwt.claims', json_build_object('sub', referrer, 'role', 'authenticated')::text, true);
  t := public.pk_admin_set_status(first_task, 'confirmed', 'All in');
  due_before := t.due_at;
  t := public.pk_admin_set_status(first_task, 'waiting_on_you', 'Need logo', array['Logo file']);
  update public.pk_tasks set paused_at = paused_at - interval '2 hours' where id = first_task;  -- pretend 2h passed
  t := public.pk_admin_set_status(first_task, 'in_progress');
  res := res || jsonb_build_object('due_confirmed', due_before, 'due_after_2h_pause', t.due_at, 'paused_cleared', t.paused_at is null);
  perform public.pk_admin_add_deliverable(first_task, 'image', client || '/x/v1.png', null, 'Chart v1', true);

  -- client reviews: 2 free rounds, then quoted
  perform set_config('request.jwt.claims', json_build_object('sub', client, 'role', 'authenticated')::text, true);
  perform public.pk_request_changes(first_task, 'Bigger logo');
  perform set_config('request.jwt.claims', json_build_object('sub', referrer, 'role', 'authenticated')::text, true);
  perform public.pk_admin_add_deliverable(first_task, 'image', client || '/x/v2.png', null, 'Chart v2', true);
  perform set_config('request.jwt.claims', json_build_object('sub', client, 'role', 'authenticated')::text, true);
  perform public.pk_request_changes(first_task, 'Change colour');
  perform set_config('request.jwt.claims', json_build_object('sub', referrer, 'role', 'authenticated')::text, true);
  perform public.pk_admin_add_deliverable(first_task, 'image', client || '/x/v3.png', null, 'Chart v3', true);
  perform set_config('request.jwt.claims', json_build_object('sub', client, 'role', 'authenticated')::text, true);
  err := null;
  begin perform public.pk_request_changes(first_task, 'Third'); exception when others then err := sqlerrm; end;
  perform public.pk_approve_delivery(first_task);
  select * into t from public.pk_tasks where id = first_task;
  res := res || jsonb_build_object('third_round_blocked', err, 'final_status', t.status,
    'versions', (select array_agg(version order by version) from public.pk_deliverables where task_id = first_task),
    'timeline', (select array_agg(status order by id) from public.pk_task_events where task_id = first_task));

  -- RLS: as the authenticated client, only own rows are visible
  perform set_config('role', 'authenticated', true);
  res := res || jsonb_build_object(
    'rls_own_tasks', (select count(*) from public.pk_tasks),
    'rls_leads_hidden', (select count(*) from public.pk_leads),
    'rls_catalog_visible', (select count(*) from public.pk_catalog_lines));
  perform set_config('role', 'postgres', true);

  -- admin marks the order invoice paid -> referrer earns 10% as points
  perform set_config('request.jwt.claims', json_build_object('sub', referrer, 'role', 'authenticated')::text, true);
  n := (select points from public.profiles where id = referrer);
  perform public.pk_admin_set_invoice_status(inv.id, 'paid');
  perform public.pk_admin_set_invoice_status(inv.id, 'paid');   -- idempotent: no double credit
  res := res || jsonb_build_object('points_credited', (select points from public.profiles where id = referrer) - n,
    'ledger_rows', (select count(*) from public.referral_ledger where source_user_id = client));

  raise exception 'DRY RUN RESULT (rolled back): %', res;
end;
$$;
