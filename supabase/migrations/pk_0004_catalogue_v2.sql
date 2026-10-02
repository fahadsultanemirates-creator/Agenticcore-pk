-- AgenticCore Pakistan — Catalogue V2 (owner-approved specification, October 2026).
-- Apply BEFORE the regenerated pk_0002_seed_catalog.sql.
-- Additive and reversible: no table is dropped, no row is deleted, RLS is unchanged.
--   1. Service numbers can now go above 56 (the V2 catalogue has 74 services).
--   2. Packages gain three flags: quote_only (Developer Partner: set-up is quoted,
--      so it can't be bought at a fixed price online), is_from (a "from" price,
--      e.g. launch kits with a website) and section (agents / projects / launch).
--   3. pk_buy_package refuses quote-only packages and labels "from" prices on the invoice.
--   4. A 'proposal' lead kind, so a Developer Partner proposal request is stored like any lead.

alter table public.pk_catalog_lines drop constraint if exists pk_catalog_lines_service_no_check;
alter table public.pk_catalog_lines add constraint pk_catalog_lines_service_no_check check (service_no between 1 and 99);

alter table public.pk_packages add column if not exists quote_only boolean not null default false;
alter table public.pk_packages add column if not exists is_from boolean not null default false;
alter table public.pk_packages add column if not exists section text;

alter table public.pk_leads drop constraint if exists pk_leads_kind_check;
alter table public.pk_leads add constraint pk_leads_kind_check check (kind in ('callback', 'lead_magnet', 'proposal'));

create or replace function public.pk_buy_package(p_package text, p_accept_terms boolean)
returns table (subscription_id uuid, invoice_number text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  uid uuid := auth.uid();
  pkg public.pk_packages;
  o public.pk_orders;
  s public.pk_subscriptions;
  it jsonb;
  line public.pk_catalog_lines;
  days int;
  inv public.pk_invoices;
  amount int;
begin
  if uid is null then raise exception 'Please log in first' using errcode = '42501'; end if;
  if not coalesce(p_accept_terms, false) then raise exception 'Please accept the package terms'; end if;
  select * into pkg from public.pk_packages where id = p_package and active;
  if not found then raise exception 'Unknown package'; end if;
  if pkg.quote_only then raise exception 'This package is set up to a proposal. Please request a proposal instead.'; end if;

  amount := coalesce(pkg.one_off, coalesce(pkg.setup, 0) + coalesce(pkg.monthly, 0));
  insert into public.pk_orders (client_id, source, package_id, total) values (uid, 'web', pkg.id, amount) returning * into o;
  insert into public.pk_subscriptions (client_id, package_id, order_id) values (uid, pkg.id, o.id) returning * into s;

  for it in select * from jsonb_array_elements(pkg.setup_items) loop
    line := null;
    if it ? 'line' then select * into line from public.pk_catalog_lines where line_id = it ->> 'line'; end if;
    days := least(coalesce(line.days, pkg.due_days), pkg.due_days);
    perform public.pk_create_task(uid, o.id, s.id, line.line_id, it ->> 'label', coalesce((it ->> 'qty')::int, 1), 0,
                                  jsonb_build_object('package', pkg.name), true, 'web', days, array['Details', 'Payment']);
  end loop;

  insert into public.pk_invoices (client_id, order_id, subscription_id, description, amount, due_date)
  values (uid, o.id, s.id,
          pkg.name || case when pkg.one_off is not null then ' — one-off package'
                           else ' — set-up + first month (monthly fees in advance; ' || pkg.min_months || '-month minimum)' end
                   || case when pkg.is_from then ' — starting price; our team confirms the final quote before work starts' else '' end,
          amount, (now() at time zone 'Asia/Karachi')::date)
  returning * into inv;

  return query select s.id, inv.number;
end;
$$;

grant execute on function public.pk_buy_package(text, boolean) to authenticated;
