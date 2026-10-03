-- Catalogue V2 upgrade checks. Every failure raises, so the runner stops on the first problem.
do $t$
declare
  uid uuid := 'a784f70c-a0ca-4229-8c2a-1a171a15ffca';
  n int; amt int; inv text; sub uuid; descr text; pk text; expected int;
  procedure_ok boolean;
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);

  -- history created on V1 survives the upgrade untouched
  select count(*) into n from pk_tasks where line_id = '29-event';
  if n <> 1 then raise exception 'V1 29-event task missing after upgrade (%)', n; end if;
  select count(*) into n from pk_invoices i join pk_orders o on o.id = i.order_id join pk_tasks t on t.order_id = o.id where t.line_id = '29-event';
  if n <> 1 then raise exception 'V1 29-event invoice missing after upgrade'; end if;
  if (select active from pk_catalog_lines where line_id = '29-event') then raise exception '29-event must be retired'; end if;
  if not exists (select 1 from pk_subscriptions where package_id = 'dealer-starter') then raise exception 'V1 subscription lost'; end if;

  -- service 74 is ordered through its new id; the old id is refused
  begin perform public.pk_place_order('[{"line_id":"29-event"}]'::jsonb); raise exception 'retired 29-event was accepted';
  exception when others then if sqlerrm like 'retired 29-event%' then raise; end if; end;
  select max(invoice_number) into inv from public.pk_place_order('[{"line_id":"balloting-event"}]'::jsonb);
  select amount into amt from pk_invoices where number = inv;
  if amt <> 25999 then raise exception 'balloting-event priced % (want 25999)', amt; end if;
  select count(*) into n from pk_catalog_lines where line_id = 'balloting-event' and service_no = 74 and active and is_from;
  if n <> 1 then raise exception 'balloting-event row wrong'; end if;

  -- service 18 is one monthly line
  select count(*) into n from pk_catalog_lines where service_no = 18 and active;
  if n <> 1 or (select price from pk_catalog_lines where line_id = '51-mo') <> 3999 or (select model from pk_catalog_lines where line_id = '51-mo') <> 'monthly'
    then raise exception 'service 18 must be a single Rs 3,999 monthly line'; end if;

  -- server-side pricing: a multi-line pack and a quantity
  select count(*), max(invoice_number) into n, inv from public.pk_place_order('[{"line_id":"p-wa-card"},{"line_id":"p-social-post"},{"line_id":"28-dfy"},{"line_id":"p-captions"}]'::jsonb);
  select amount into amt from pk_invoices where number = inv;
  if n <> 4 or amt <> 4296 then raise exception 'pack: % tasks, %', n, amt; end if;
  select max(invoice_number) into inv from public.pk_place_order('[{"line_id":"p-flyer","quantity":2}]'::jsonb);
  if (select amount from pk_invoices where number = inv) <> 1998 then raise exception '2 x flyer mispriced'; end if;
  begin perform public.pk_place_order('[{"line_id":"9-dfy"}]'::jsonb); raise exception 'retired 9-dfy was accepted';
  exception when others then if sqlerrm like 'retired 9-dfy%' then raise; end if; end;

  -- every orderable package, first invoice = set-up + first month (or one-off)
  foreach pk in array array['agent-monthly:7999','agent-pro:14999','agency-growth:39998','project-monthly:19999','project-growth:49998','agency-launch:14999','agency-launch-web:39999','project-launch:39999','project-launch-web:64999'] loop
    expected := split_part(pk, ':', 2)::int; pk := split_part(pk, ':', 1);
    select subscription_id, invoice_number into sub, inv from public.pk_buy_package(pk, true);
    select amount, description into amt, descr from pk_invoices where number = inv;
    if amt <> expected then raise exception 'package % invoiced % (want %)', pk, amt, expected; end if;
    if (pk like '%-web') <> (descr like '%starting price%') then raise exception 'package % "from" label wrong', pk; end if;
  end loop;
  begin perform public.pk_buy_package('developer-partner', true); raise exception 'developer-partner was bought';
  exception when others then if sqlerrm not like '%proposal%' then raise; end if; end;
  begin perform public.pk_buy_package('dealer-starter', true); raise exception 'retired dealer-starter was bought';
  exception when others then if sqlerrm like 'retired%' then raise; end if; end;

  -- Estate listing ownership (pk_0003) unchanged
  begin perform public.pk_place_order('[{"line_id":"p-wa-card","details":{"estate_listing_id":"00000000-0000-0000-0000-000000000001"}}]'::jsonb); raise exception 'foreign listing accepted';
  exception when others then if sqlstate <> '42501' then raise; end if; end;
  begin perform public.pk_place_order('[{"line_id":"p-wa-card","details":{"estate_listing_id":"not-a-uuid"}}]'::jsonb); raise exception 'malformed listing accepted';
  exception when others then if sqlstate <> '22023' then raise; end if; end;
  perform public.pk_place_order('[{"line_id":"p-wa-card","details":{"estate_listing_id":"11111111-1111-1111-1111-111111111111"}}]'::jsonb);

  -- proposal leads are allowed
  insert into pk_leads (kind, name, phone, magnet) values ('proposal', 'Test', '+92 300 0000000', 'developer-partner');

  select count(*) into n from pk_catalog_lines where active; if n <> 77 then raise exception '% active lines (want 77)', n; end if;
  select count(*) into n from pk_catalog_lines where not active; if n <> 19 then raise exception '% retired lines (want 19)', n; end if;
  select count(*) into n from pk_packages where active; if n <> 10 then raise exception '% active packages (want 10)', n; end if;
  raise notice 'catalogue_v2: all checks passed';
end $t$;
