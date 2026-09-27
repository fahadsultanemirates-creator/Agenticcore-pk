-- ============================================================
-- AgenticCore Pakistan (agenticcorepk.com) — initial schema
-- ------------------------------------------------------------
-- Applied to the SHARED agenticcore.estate project
-- (iuwjlvcfnxbfhbkztsel) so one account and one points balance
-- work on both sites. Everything here is additive and pk_-prefixed;
-- estate's own tables are only read, except two deliberate writes
-- that the referral model requires when a pk invoice is paid:
--   * one referral_ledger row for the referrer, and
--   * profiles.points += 10% of the paid amount (1 point = Rs 1).
--
-- Rules implemented here (from the build brief):
--   * Task IDs ACPK-0001... come from a Postgres SEQUENCE, never from
--     counting rows (row counting races when two orders arrive at once).
--   * 8 client-facing statuses; the delivery clock is paused while a
--     task is "waiting_on_you" and the pause is added back on resume.
--   * Due time: same day if confirmed by 6pm PKT, else next day;
--     N days for 2-3 day / 1 week services. Cut-off and due hour live
--     in pk_settings so they can change without a code change.
--   * Prices are looked up server-side from pk_catalog_lines (seeded
--     from data/services.json by scripts/gen-seed-sql.mjs), never
--     trusted from the browser.
--   * RLS on every table; clients see only their own rows; every
--     status change goes through a security-definer function.
-- ============================================================

-- ---------- sequences ----------
create sequence if not exists public.pk_task_seq start 1;
create sequence if not exists public.pk_invoice_seq start 1;

create or replace function public.pk_format_id(prefix text, n bigint)
returns text language sql immutable as $$
  -- lpad would silently truncate past 9999, so only pad short numbers
  select prefix || case when n < 10000 then lpad(n::text, 4, '0') else n::text end;
$$;

-- ---------- settings ----------
create table if not exists public.pk_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
insert into public.pk_settings (key, value) values
  ('cutoff_hour_pkt', '18'),
  ('due_hour_pkt', '21'),
  ('max_free_revisions', '2')
on conflict (key) do nothing;

create or replace function public.pk_setting_int(p_key text, p_default int)
returns int language sql stable security definer set search_path = public as $$
  select coalesce((select (value #>> '{}')::int from public.pk_settings where key = p_key), p_default);
$$;

-- ---------- catalogue (seeded from data/*.json) ----------
create table if not exists public.pk_catalog_lines (
  line_id text primary key,
  service_no smallint not null check (service_no between 1 and 56),
  service_name text not null,
  model text not null check (model in ('dfy', 'setup', 'monthly')),
  price integer not null check (price > 0),
  unit text,
  days smallint,              -- 0 = same day, 3 = 2-3 days, null = scheduled/quoted
  is_from boolean not null default false,
  active boolean not null default true
);

create table if not exists public.pk_packages (
  id text primary key,
  name text not null,
  monthly integer,
  setup integer,
  one_off integer,
  min_months smallint not null default 0,
  due_days smallint not null default 0,
  setup_items jsonb not null default '[]'::jsonb,
  active boolean not null default true
);

create table if not exists public.pk_package_allowances (
  package_id text not null references public.pk_packages(id) on delete cascade,
  item_key text not null,
  label text not null,
  qty integer not null check (qty >= 0),
  service_no smallint,
  extra_line_id text references public.pk_catalog_lines(line_id),
  primary key (package_id, item_key)
);

-- ---------- orders & tasks ----------
create table if not exists public.pk_orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  source text not null default 'web' check (source in ('web', 'telegram', 'whatsapp', 'admin')),
  package_id text references public.pk_packages(id),
  total integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.pk_subscriptions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  package_id text not null references public.pk_packages(id),
  order_id uuid references public.pk_orders(id),
  status text not null default 'pending' check (status in ('pending', 'active', 'cancelled', 'ended')),
  started_at timestamptz,
  min_term_end timestamptz,
  renews_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.pk_tasks (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique default public.pk_format_id('ACPK-', nextval('public.pk_task_seq')),
  order_id uuid references public.pk_orders(id) on delete set null,
  subscription_id uuid references public.pk_subscriptions(id) on delete set null,
  client_id uuid not null references public.profiles(id) on delete cascade,
  service_no smallint,
  line_id text references public.pk_catalog_lines(line_id),
  title text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price integer not null default 0,
  amount integer not null default 0,
  details jsonb not null default '{}'::jsonb,
  use_brand_kit boolean not null default true,
  status text not null default 'received' check (status in (
    'received', 'waiting_on_you', 'confirmed', 'in_progress',
    'ready_for_review', 'changes_requested', 'delivered', 'cancelled')),
  source text not null default 'web' check (source in ('web', 'telegram', 'whatsapp', 'admin')),
  turnaround_days smallint,
  confirmed_at timestamptz,
  due_at timestamptz,
  paused_at timestamptz,
  missing text[] not null default '{}',
  late_reason text,
  revisions_used smallint not null default 0 check (revisions_used between 0 and 2),
  assigned_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists pk_tasks_client_idx on public.pk_tasks(client_id, created_at desc);
create index if not exists pk_tasks_status_idx on public.pk_tasks(status, due_at);

create table if not exists public.pk_task_events (
  id bigint generated always as identity primary key,
  task_id uuid not null references public.pk_tasks(id) on delete cascade,
  status text not null,
  note text,
  actor_id uuid references public.profiles(id),
  actor_kind text not null default 'system' check (actor_kind in ('client', 'team', 'system')),
  created_at timestamptz not null default now()
);
create index if not exists pk_task_events_task_idx on public.pk_task_events(task_id, created_at);

create table if not exists public.pk_messages (
  id bigint generated always as identity primary key,
  task_id uuid not null references public.pk_tasks(id) on delete cascade,
  author_id uuid references public.profiles(id),
  from_team boolean not null default false,
  via text not null default 'web' check (via in ('web', 'telegram', 'whatsapp')),
  body text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists pk_messages_task_idx on public.pk_messages(task_id, created_at);

create table if not exists public.pk_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.pk_tasks(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  path text not null,
  name text,
  created_at timestamptz not null default now()
);

create table if not exists public.pk_deliverables (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.pk_tasks(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  version smallint not null default 1,
  kind text not null default 'file' check (kind in ('image', 'pdf', 'video', 'link', 'file')),
  path text,        -- object path in the private pk-deliverables bucket
  url text,         -- or an external link
  label text,
  created_at timestamptz not null default now(),
  check (path is not null or url is not null)
);
create index if not exists pk_deliverables_client_idx on public.pk_deliverables(client_id, created_at desc);

create table if not exists public.pk_revisions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.pk_tasks(id) on delete cascade,
  round smallint not null check (round between 1 and 2),
  note text not null,
  attachment_path text,
  created_at timestamptz not null default now(),
  unique (task_id, round)
);

-- ---------- money ----------
create table if not exists public.pk_invoices (
  id uuid primary key default gen_random_uuid(),
  number text not null unique default public.pk_format_id('INV-', nextval('public.pk_invoice_seq')),
  client_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.pk_orders(id) on delete set null,
  task_id uuid references public.pk_tasks(id) on delete set null,
  subscription_id uuid references public.pk_subscriptions(id) on delete set null,
  description text not null,
  amount integer not null check (amount >= 0),
  paid_amount integer not null default 0 check (paid_amount >= 0),
  status text not null default 'due' check (status in ('due', 'payment_submitted', 'part_paid', 'paid', 'refunded', 'cancelled')),
  due_date date,
  referral_credited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists pk_invoices_client_idx on public.pk_invoices(client_id, created_at desc);

-- Payment proofs. No payment METHODS are defined anywhere in this
-- schema on purpose: account details must come from admin settings
-- that Fahad confirms he controls, and are not part of launch.
create table if not exists public.pk_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.pk_invoices(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null check (amount > 0),
  reference text,
  proof_path text,
  status text not null default 'submitted' check (status in ('submitted', 'confirmed', 'rejected')),
  decided_by uuid references public.profiles(id),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.pk_usage (
  id bigint generated always as identity primary key,
  subscription_id uuid not null references public.pk_subscriptions(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  item_key text not null,
  qty integer not null default 1,
  period_start date not null default date_trunc('month', (now() at time zone 'Asia/Karachi'))::date,
  task_id uuid references public.pk_tasks(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists pk_usage_sub_idx on public.pk_usage(subscription_id, period_start);

-- ---------- client profile extras ----------
create table if not exists public.pk_client_settings (
  client_id uuid primary key references public.profiles(id) on delete cascade,
  business_name text,
  city text,
  whatsapp text,
  preferred_lang text not null default 'en' check (preferred_lang in ('en', 'ur')),
  notify jsonb not null default '{"email": true, "telegram": false, "whatsapp": false}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.pk_brand_kits (
  client_id uuid primary key references public.profiles(id) on delete cascade,
  colors jsonb not null default '[]'::jsonb,
  fonts text,
  contact jsonb not null default '{}'::jsonb,
  taglines jsonb not null default '{}'::jsonb,
  approvals jsonb not null default '[]'::jsonb,
  files jsonb not null default '[]'::jsonb,   -- [{path, name, kind: logo_light|logo_dark|photo|other}]
  updated_at timestamptz not null default now()
);

create table if not exists public.pk_notifications (
  id bigint generated always as identity primary key,
  client_id uuid not null references public.profiles(id) on delete cascade,
  task_id uuid references public.pk_tasks(id) on delete set null,
  kind text not null,
  channel text not null default 'dashboard' check (channel in ('dashboard', 'email', 'telegram', 'whatsapp')),
  body text not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'read')),
  created_at timestamptz not null default now()
);
create index if not exists pk_notifications_client_idx on public.pk_notifications(client_id, created_at desc);

-- ---------- public forms & analytics (anonymous inserts) ----------
create table if not exists public.pk_leads (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'callback' check (kind in ('callback', 'lead_magnet')),
  name text not null check (length(name) between 1 and 120),
  phone text not null check (length(phone) between 7 and 30),
  city text check (length(city) <= 80),
  role text check (role in ('dealer', 'agency', 'developer', 'other')),
  email text check (length(email) <= 200),
  section text check (length(section) <= 60),
  magnet text check (length(magnet) <= 60),
  status text not null default 'new' check (status in ('new', 'contacted', 'converted', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.pk_events (
  id bigint generated always as identity primary key,
  event text not null check (length(event) <= 40),
  section text check (length(section) <= 60),
  path text check (length(path) <= 200),
  meta jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.pk_settings enable row level security;
alter table public.pk_catalog_lines enable row level security;
alter table public.pk_packages enable row level security;
alter table public.pk_package_allowances enable row level security;
alter table public.pk_orders enable row level security;
alter table public.pk_subscriptions enable row level security;
alter table public.pk_tasks enable row level security;
alter table public.pk_task_events enable row level security;
alter table public.pk_messages enable row level security;
alter table public.pk_attachments enable row level security;
alter table public.pk_deliverables enable row level security;
alter table public.pk_revisions enable row level security;
alter table public.pk_invoices enable row level security;
alter table public.pk_payments enable row level security;
alter table public.pk_usage enable row level security;
alter table public.pk_client_settings enable row level security;
alter table public.pk_brand_kits enable row level security;
alter table public.pk_notifications enable row level security;
alter table public.pk_leads enable row level security;
alter table public.pk_events enable row level security;

-- public reference data
create policy "pk settings readable" on public.pk_settings for select using (true);
create policy "pk settings admin write" on public.pk_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "pk catalog readable" on public.pk_catalog_lines for select using (true);
create policy "pk catalog admin write" on public.pk_catalog_lines for all using (public.is_admin()) with check (public.is_admin());
create policy "pk packages readable" on public.pk_packages for select using (true);
create policy "pk packages admin write" on public.pk_packages for all using (public.is_admin()) with check (public.is_admin());
create policy "pk allowances readable" on public.pk_package_allowances for select using (true);
create policy "pk allowances admin write" on public.pk_package_allowances for all using (public.is_admin()) with check (public.is_admin());

-- client-owned, read-only for the client (writes go through RPCs below)
create policy "pk orders own or admin" on public.pk_orders for select using (client_id = auth.uid() or public.is_admin());
create policy "pk subscriptions own or admin" on public.pk_subscriptions for select using (client_id = auth.uid() or public.is_admin());
create policy "pk tasks own or admin" on public.pk_tasks for select using (client_id = auth.uid() or public.is_admin());
create policy "pk deliverables own or admin" on public.pk_deliverables for select using (client_id = auth.uid() or public.is_admin());
create policy "pk attachments own or admin" on public.pk_attachments for select using (client_id = auth.uid() or public.is_admin());
create policy "pk invoices own or admin" on public.pk_invoices for select using (client_id = auth.uid() or public.is_admin());
create policy "pk payments own or admin" on public.pk_payments for select using (client_id = auth.uid() or public.is_admin());
create policy "pk usage own or admin" on public.pk_usage for select using (client_id = auth.uid() or public.is_admin());
create policy "pk notifications own or admin" on public.pk_notifications for select using (client_id = auth.uid() or public.is_admin());
create policy "pk task events own or admin" on public.pk_task_events for select using (
  public.is_admin() or exists (select 1 from public.pk_tasks t where t.id = task_id and t.client_id = auth.uid()));
create policy "pk messages own or admin" on public.pk_messages for select using (
  public.is_admin() or exists (select 1 from public.pk_tasks t where t.id = task_id and t.client_id = auth.uid()));
create policy "pk revisions own or admin" on public.pk_revisions for select using (
  public.is_admin() or exists (select 1 from public.pk_tasks t where t.id = task_id and t.client_id = auth.uid()));

-- the client edits their own settings and brand kit directly
create policy "pk client settings own select" on public.pk_client_settings for select using (client_id = auth.uid() or public.is_admin());
create policy "pk client settings own insert" on public.pk_client_settings for insert with check (client_id = auth.uid());
create policy "pk client settings own update" on public.pk_client_settings for update using (client_id = auth.uid()) with check (client_id = auth.uid());
create policy "pk brand kit own select" on public.pk_brand_kits for select using (client_id = auth.uid() or public.is_admin());
create policy "pk brand kit own insert" on public.pk_brand_kits for insert with check (client_id = auth.uid());
create policy "pk brand kit own update" on public.pk_brand_kits for update using (client_id = auth.uid()) with check (client_id = auth.uid());

-- public forms: anyone may insert, only admins may read
create policy "pk leads public insert" on public.pk_leads for insert to anon, authenticated with check (status = 'new');
create policy "pk leads admin read" on public.pk_leads for select using (public.is_admin());
create policy "pk leads admin update" on public.pk_leads for update using (public.is_admin());
create policy "pk events public insert" on public.pk_events for insert to anon, authenticated with check (true);
create policy "pk events admin read" on public.pk_events for select using (public.is_admin());

-- ============================================================
-- Helpers
-- ============================================================

-- Due time from the moment work is confirmed. Same day if confirmed by
-- the cut-off (6pm PKT), otherwise the next day; then add the service's
-- turnaround days. Null days = scheduled/quoted work with no fixed due.
create or replace function public.pk_compute_due(p_from timestamptz, p_days int)
returns timestamptz language plpgsql stable security definer set search_path = public as $$
declare
  local_ts timestamp := p_from at time zone 'Asia/Karachi';
  base_date date;
begin
  if p_days is null then return null; end if;
  base_date := local_ts::date + case when extract(hour from local_ts) >= public.pk_setting_int('cutoff_hour_pkt', 18) then 1 else 0 end;
  return ((base_date + p_days)::timestamp + make_interval(hours => public.pk_setting_int('due_hour_pkt', 21))) at time zone 'Asia/Karachi';
end;
$$;

create or replace function public.pk_log_event(p_task uuid, p_status text, p_note text, p_kind text)
returns void language sql security definer set search_path = public as $$
  insert into public.pk_task_events (task_id, status, note, actor_id, actor_kind)
  values (p_task, p_status, p_note, auth.uid(), p_kind);
$$;

-- Queues an in-dashboard notification (always) and marks which external
-- channels the client asked for; a sender job (Telegram bot / email)
-- picks up 'queued' rows for those channels.
create or replace function public.pk_notify(p_client uuid, p_task uuid, p_kind text, p_body text)
returns void language plpgsql security definer set search_path = public as $$
declare
  prefs jsonb;
  ch text;
begin
  insert into public.pk_notifications (client_id, task_id, kind, channel, body, status)
  values (p_client, p_task, p_kind, 'dashboard', p_body, 'sent');
  select notify into prefs from public.pk_client_settings where client_id = p_client;
  prefs := coalesce(prefs, '{"email": true}'::jsonb);
  foreach ch in array array['email', 'telegram', 'whatsapp'] loop
    if coalesce((prefs ->> ch)::boolean, false) then
      insert into public.pk_notifications (client_id, task_id, kind, channel, body) values (p_client, p_task, p_kind, ch, p_body);
    end if;
  end loop;
end;
$$;

create or replace function public.pk_require_admin()
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
end;
$$;

-- Internal: create one task row + its first events. Starts in
-- "waiting_on_you" with a checklist of what we still need, because
-- no order has details, content AND payment at the moment it's placed.
create or replace function public.pk_create_task(
  p_client uuid, p_order uuid, p_sub uuid, p_line text, p_title text, p_qty int,
  p_unit_price int, p_details jsonb, p_brand boolean, p_source text, p_days int, p_missing text[])
returns public.pk_tasks language plpgsql security definer set search_path = public as $$
declare
  svc smallint;
  t public.pk_tasks;
begin
  select service_no into svc from public.pk_catalog_lines where line_id = p_line;
  insert into public.pk_tasks (order_id, subscription_id, client_id, service_no, line_id, title, quantity, unit_price, amount,
                               details, use_brand_kit, status, source, turnaround_days, missing, paused_at)
  values (p_order, p_sub, p_client, svc, p_line, p_title, greatest(p_qty, 1), p_unit_price, p_unit_price * greatest(p_qty, 1),
          coalesce(p_details, '{}'::jsonb), coalesce(p_brand, true), 'waiting_on_you', p_source, p_days, p_missing, now())
  returning * into t;
  perform public.pk_log_event(t.id, 'received', 'Order logged. Task ID ' || t.public_id || ' sent.', 'system');
  perform public.pk_log_event(t.id, 'waiting_on_you', 'Waiting on: ' || array_to_string(p_missing, ', '), 'system');
  perform public.pk_notify(p_client, t.id, 'task_received', 'We received your order ' || t.public_id || ' (' || p_title || ').');
  return t;
end;
$$;

-- ============================================================
-- Client RPCs
-- ============================================================

-- Place an order for one or more service lines.
-- p_items: [{ "line_id": "4-dfy", "quantity": 1, "details": {...}, "use_brand_kit": true }]
create or replace function public.pk_place_order(p_items jsonb, p_source text default 'web')
returns table (task_id uuid, public_id text, invoice_number text)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  uid uuid := auth.uid();
  o public.pk_orders;
  item jsonb;
  line public.pk_catalog_lines;
  qty int;
  t public.pk_tasks;
  v_total int := 0;
  inv public.pk_invoices;
  created uuid[] := '{}';
  missing text[];
begin
  if uid is null then raise exception 'Please log in first' using errcode = '42501'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'No items in order'; end if;
  if jsonb_array_length(p_items) > 20 then raise exception 'Too many items in one order'; end if;
  if p_source not in ('web', 'telegram', 'whatsapp') then p_source := 'web'; end if;

  insert into public.pk_orders (client_id, source) values (uid, p_source) returning * into o;

  for item in select * from jsonb_array_elements(p_items) loop
    select * into line from public.pk_catalog_lines where line_id = item ->> 'line_id' and active;
    if not found then raise exception 'Unknown service option %', item ->> 'line_id'; end if;
    qty := least(greatest(coalesce((item ->> 'quantity')::int, 1), 1), 100);
    missing := array['Payment'];
    if coalesce(item -> 'details', '{}'::jsonb) = '{}'::jsonb then missing := array['Details'] || missing; end if;
    t := public.pk_create_task(uid, o.id, null, line.line_id, line.service_name, qty, line.price,
                               item -> 'details', coalesce((item ->> 'use_brand_kit')::boolean, true), p_source, line.days, missing);
    v_total := v_total + t.amount;
    created := created || t.id;
  end loop;

  update public.pk_orders set total = v_total where id = o.id;
  insert into public.pk_invoices (client_id, order_id, task_id, description, amount, due_date)
  values (uid, o.id, case when array_length(created, 1) = 1 then created[1] end,
          'Order ' || (select string_agg(pt.public_id, ', ' order by pt.public_id) from public.pk_tasks pt where pt.id = any(created))
          || ' — one-off work: half at the start, half on delivery; monthly fees in advance.',
          v_total, (now() at time zone 'Asia/Karachi')::date)
  returning * into inv;

  return query select pt.id, pt.public_id, inv.number from public.pk_tasks pt where pt.id = any(created) order by pt.public_id;
end;
$$;

-- Buy a package: a pending subscription (activated by an admin once the
-- first payment is confirmed), one set-up task per set-up item, and an
-- invoice for set-up + first month (or the one-off price).
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
                           else ' — set-up + first month (monthly fees in advance; ' || pkg.min_months || '-month minimum)' end,
          amount, (now() at time zone 'Asia/Karachi')::date)
  returning * into inv;

  return query select s.id, inv.number;
end;
$$;

create or replace function public.pk_own_task(p_task uuid)
returns public.pk_tasks language plpgsql stable security definer set search_path = public as $$
declare t public.pk_tasks;
begin
  select * into t from public.pk_tasks where id = p_task and client_id = auth.uid();
  if not found then raise exception 'Task not found' using errcode = '42501'; end if;
  return t;
end;
$$;

-- Add details / a note to a task (logged on the timeline and thread).
create or replace function public.pk_add_details(p_task uuid, p_details jsonb, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare t public.pk_tasks := public.pk_own_task(p_task);
begin
  if t.status in ('delivered', 'cancelled') then raise exception 'This task is closed'; end if;
  update public.pk_tasks set details = details || coalesce(p_details, '{}'::jsonb),
         missing = array_remove(missing, 'Details'), updated_at = now() where id = t.id;
  if coalesce(p_note, '') <> '' then
    insert into public.pk_messages (task_id, author_id, body) values (t.id, auth.uid(), p_note);
  end if;
  perform public.pk_log_event(t.id, t.status, 'Client added details', 'client');
end;
$$;

create or replace function public.pk_register_attachment(p_task uuid, p_path text, p_name text)
returns void language plpgsql security definer set search_path = public as $$
declare t public.pk_tasks := public.pk_own_task(p_task);
begin
  if split_part(p_path, '/', 1) <> auth.uid()::text then raise exception 'Bad path'; end if;
  insert into public.pk_attachments (task_id, client_id, path, name) values (t.id, t.client_id, p_path, p_name);
  update public.pk_tasks set missing = array_remove(missing, 'Content'), updated_at = now() where id = t.id;
  perform public.pk_log_event(t.id, t.status, 'Client uploaded ' || coalesce(p_name, 'a file'), 'client');
end;
$$;

create or replace function public.pk_post_message(p_task uuid, p_body text)
returns void language plpgsql security definer set search_path = public as $$
declare t public.pk_tasks;
begin
  if public.is_admin() then
    select * into t from public.pk_tasks where id = p_task;
    insert into public.pk_messages (task_id, author_id, from_team, body) values (p_task, auth.uid(), true, p_body);
    perform public.pk_notify(t.client_id, t.id, 'message', 'New message on ' || t.public_id);
  else
    t := public.pk_own_task(p_task);
    insert into public.pk_messages (task_id, author_id, body) values (t.id, auth.uid(), p_body);
  end if;
end;
$$;

-- Cancel is allowed only before work starts.
create or replace function public.pk_cancel_task(p_task uuid)
returns void language plpgsql security definer set search_path = public as $$
declare t public.pk_tasks := public.pk_own_task(p_task);
begin
  if t.status not in ('received', 'waiting_on_you', 'confirmed') then
    raise exception 'Work has already started on %, so it can no longer be cancelled here. Please message us.', t.public_id;
  end if;
  update public.pk_tasks set status = 'cancelled', paused_at = null, updated_at = now() where id = t.id;
  perform public.pk_log_event(t.id, 'cancelled', 'Cancelled by client', 'client');
end;
$$;

-- Two free rounds of changes; after that, further changes are quoted.
create or replace function public.pk_request_changes(p_task uuid, p_note text, p_attachment text default null)
returns smallint language plpgsql security definer set search_path = public as $$
declare
  t public.pk_tasks := public.pk_own_task(p_task);
  r smallint;
begin
  if t.status <> 'ready_for_review' then raise exception 'Changes can be requested when a delivery is ready for review'; end if;
  if t.revisions_used >= public.pk_setting_int('max_free_revisions', 2) then
    raise exception 'Both free rounds of changes are used. Further changes are quoted separately.';
  end if;
  if coalesce(trim(p_note), '') = '' then raise exception 'Please describe the changes'; end if;
  r := t.revisions_used + 1;
  insert into public.pk_revisions (task_id, round, note, attachment_path) values (t.id, r, p_note, p_attachment);
  update public.pk_tasks set status = 'changes_requested', revisions_used = r, updated_at = now() where id = t.id;
  perform public.pk_log_event(t.id, 'changes_requested', 'Round ' || r || ' of 2: ' || left(p_note, 300), 'client');
  return r;
end;
$$;

create or replace function public.pk_approve_delivery(p_task uuid)
returns void language plpgsql security definer set search_path = public as $$
declare t public.pk_tasks := public.pk_own_task(p_task);
begin
  if t.status <> 'ready_for_review' then raise exception 'Nothing is waiting for your approval on %', t.public_id; end if;
  update public.pk_tasks set status = 'delivered', updated_at = now() where id = t.id;
  perform public.pk_log_event(t.id, 'delivered', 'Approved by client', 'client');
end;
$$;

-- ============================================================
-- Admin RPCs (all gated by is_admin())
-- ============================================================

create or replace function public.pk_admin_set_status(
  p_task uuid, p_status text, p_note text default null, p_missing text[] default null,
  p_late_reason text default null, p_new_due timestamptz default null)
returns public.pk_tasks language plpgsql security definer set search_path = public as $$
declare
  t public.pk_tasks;
  new_due timestamptz;
  new_paused timestamptz;
begin
  perform public.pk_require_admin();
  select * into t from public.pk_tasks where id = p_task for update;
  if not found then raise exception 'Task not found'; end if;
  if p_status not in ('received', 'waiting_on_you', 'confirmed', 'in_progress', 'ready_for_review', 'changes_requested', 'delivered', 'cancelled') then
    raise exception 'Bad status %', p_status;
  end if;

  new_due := t.due_at;
  new_paused := t.paused_at;

  if p_status = 'waiting_on_you' then
    new_paused := coalesce(t.paused_at, now());               -- clock stops
  elsif t.paused_at is not null then
    if new_due is not null then new_due := new_due + (now() - t.paused_at); end if;  -- clock resumes, pause added back
    new_paused := null;
  end if;

  if p_status = 'confirmed' and t.due_at is null then
    new_due := public.pk_compute_due(now(), t.turnaround_days);
  end if;
  if p_new_due is not null then new_due := p_new_due; end if;

  update public.pk_tasks set
    status = p_status,
    confirmed_at = case when p_status = 'confirmed' then coalesce(confirmed_at, now()) else confirmed_at end,
    due_at = new_due,
    paused_at = new_paused,
    missing = case when p_status = 'waiting_on_you' then coalesce(p_missing, missing) else '{}' end,
    late_reason = coalesce(p_late_reason, late_reason),
    updated_at = now()
  where id = t.id returning * into t;

  perform public.pk_log_event(t.id, p_status, coalesce(p_note, case when p_late_reason is not null then 'Running late: ' || p_late_reason end), 'team');
  perform public.pk_notify(t.client_id, t.id, 'status_' || p_status, t.public_id || ' is now: ' || replace(p_status, '_', ' ') || coalesce('. ' || p_note, ''));
  return t;
end;
$$;

-- Log a task that came in by Telegram / WhatsApp / phone for a client.
create or replace function public.pk_admin_create_task(
  p_client uuid, p_line text, p_qty int, p_details jsonb, p_source text, p_title text default null)
returns public.pk_tasks language plpgsql security definer set search_path = public as $$
declare
  line public.pk_catalog_lines;
  t public.pk_tasks;
begin
  perform public.pk_require_admin();
  select * into line from public.pk_catalog_lines where line_id = p_line;
  if not found then raise exception 'Unknown service option %', p_line; end if;
  t := public.pk_create_task(p_client, null, null, line.line_id, coalesce(p_title, line.service_name), coalesce(p_qty, 1), line.price,
                             p_details, true, coalesce(p_source, 'admin'), line.days, array['Payment']);
  insert into public.pk_invoices (client_id, task_id, description, amount, due_date)
  values (p_client, t.id, t.public_id || ' — ' || t.title, t.amount, (now() at time zone 'Asia/Karachi')::date);
  return t;
end;
$$;

create or replace function public.pk_admin_add_deliverable(
  p_task uuid, p_kind text, p_path text, p_url text, p_label text, p_mark_ready boolean default true)
returns public.pk_deliverables language plpgsql security definer set search_path = public as $$
declare
  t public.pk_tasks;
  d public.pk_deliverables;
begin
  perform public.pk_require_admin();
  select * into t from public.pk_tasks where id = p_task;
  if not found then raise exception 'Task not found'; end if;
  insert into public.pk_deliverables (task_id, client_id, version, kind, path, url, label)
  values (t.id, t.client_id, t.revisions_used + 1, coalesce(p_kind, 'file'), p_path, p_url, p_label)
  returning * into d;
  if p_mark_ready then
    perform public.pk_admin_set_status(t.id, 'ready_for_review', 'Files uploaded (v' || d.version || ')');
  end if;
  return d;
end;
$$;

create or replace function public.pk_admin_create_invoice(
  p_client uuid, p_description text, p_amount int, p_due date default null, p_task uuid default null, p_subscription uuid default null)
returns public.pk_invoices language plpgsql security definer set search_path = public as $$
declare inv public.pk_invoices;
begin
  perform public.pk_require_admin();
  insert into public.pk_invoices (client_id, task_id, subscription_id, description, amount, due_date)
  values (p_client, p_task, p_subscription, p_description, p_amount, coalesce(p_due, (now() at time zone 'Asia/Karachi')::date))
  returning * into inv;
  perform public.pk_notify(p_client, p_task, 'invoice_due', 'Invoice ' || inv.number || ' for Rs ' || p_amount || ' is due.');
  return inv;
end;
$$;

-- Marking an invoice paid is the "spend" event of the shared referral
-- model: the client's direct referrer earns 10% of the paid amount as
-- AgenticCore Points (1 point = Rs 1), once per invoice.
create or replace function public.pk_admin_set_invoice_status(p_invoice uuid, p_status text, p_paid_amount int default null)
returns public.pk_invoices language plpgsql security definer set search_path = public as $$
declare
  inv public.pk_invoices;
  referrer uuid;
  pts int;
begin
  perform public.pk_require_admin();
  if p_status not in ('due', 'payment_submitted', 'part_paid', 'paid', 'refunded', 'cancelled') then raise exception 'Bad status'; end if;
  select * into inv from public.pk_invoices where id = p_invoice for update;
  if not found then raise exception 'Invoice not found'; end if;

  update public.pk_invoices set status = p_status,
    paid_amount = coalesce(p_paid_amount, case when p_status = 'paid' then amount else paid_amount end),
    updated_at = now()
  where id = inv.id returning * into inv;

  if inv.status = 'paid' and not inv.referral_credited and inv.paid_amount > 0 then
    select referred_by into referrer from public.profiles where id = inv.client_id;
    if referrer is not null then
      pts := floor(inv.paid_amount * 0.10);
      insert into public.referral_ledger (beneficiary_id, source_user_id, transaction_reference, transaction_value, points_awarded)
      values (referrer, inv.client_id, 'agenticcorepk:' || inv.number, inv.paid_amount, pts);
      update public.profiles set points = points + pts where id = referrer;
    end if;
    update public.pk_invoices set referral_credited = true where id = inv.id returning * into inv;
    perform public.pk_notify(inv.client_id, inv.task_id, 'payment_confirmed', 'Payment confirmed for ' || inv.number || '. Thank you.');
  end if;
  return inv;
end;
$$;

create or replace function public.pk_admin_set_subscription_status(p_sub uuid, p_status text)
returns public.pk_subscriptions language plpgsql security definer set search_path = public as $$
declare
  s public.pk_subscriptions;
  months int;
begin
  perform public.pk_require_admin();
  select * into s from public.pk_subscriptions where id = p_sub for update;
  if not found then raise exception 'Subscription not found'; end if;
  select min_months into months from public.pk_packages where id = s.package_id;
  update public.pk_subscriptions set status = p_status,
    started_at = case when p_status = 'active' then coalesce(started_at, now()) else started_at end,
    min_term_end = case when p_status = 'active' then coalesce(min_term_end, now() + make_interval(months => months)) else min_term_end end,
    renews_at = case when p_status = 'active' then coalesce(renews_at, now() + interval '1 month') else renews_at end
  where id = s.id returning * into s;
  return s;
end;
$$;

create or replace function public.pk_admin_record_usage(p_sub uuid, p_item text, p_qty int, p_task uuid default null, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare s public.pk_subscriptions;
begin
  perform public.pk_require_admin();
  select * into s from public.pk_subscriptions where id = p_sub;
  if not found then raise exception 'Subscription not found'; end if;
  insert into public.pk_usage (subscription_id, client_id, item_key, qty, task_id, note) values (s.id, s.client_id, p_item, coalesce(p_qty, 1), p_task, p_note);
end;
$$;

-- Admin client list with contact details (profiles.phone is not in any
-- broadly readable view, so this goes through a gated function).
create or replace function public.pk_admin_clients()
returns table (id uuid, full_name text, phone text, email text, role text, points int, business_name text, city text, joined_at timestamptz, open_tasks bigint)
language sql stable security definer set search_path = public, auth as $$
  select p.id, p.full_name, p.phone, u.email::text, p.role, p.points, cs.business_name, cs.city, p.created_at,
         (select count(*) from public.pk_tasks t where t.client_id = p.id and t.status not in ('delivered', 'cancelled'))
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.pk_client_settings cs on cs.client_id = p.id
  where public.is_admin()
  order by p.created_at desc;
$$;

-- ---------- grants ----------
revoke all on function public.pk_create_task(uuid, uuid, uuid, text, text, int, int, jsonb, boolean, text, int, text[]) from public, anon, authenticated;
revoke all on function public.pk_log_event(uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.pk_notify(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.pk_own_task(uuid) from public, anon;

grant execute on function public.pk_place_order(jsonb, text) to authenticated;
grant execute on function public.pk_buy_package(text, boolean) to authenticated;
grant execute on function public.pk_add_details(uuid, jsonb, text) to authenticated;
grant execute on function public.pk_register_attachment(uuid, text, text) to authenticated;
grant execute on function public.pk_post_message(uuid, text) to authenticated;
grant execute on function public.pk_cancel_task(uuid) to authenticated;
grant execute on function public.pk_request_changes(uuid, text, text) to authenticated;
grant execute on function public.pk_approve_delivery(uuid) to authenticated;
grant execute on function public.pk_admin_set_status(uuid, text, text, text[], text, timestamptz) to authenticated;
grant execute on function public.pk_admin_create_task(uuid, text, int, jsonb, text, text) to authenticated;
grant execute on function public.pk_admin_add_deliverable(uuid, text, text, text, text, boolean) to authenticated;
grant execute on function public.pk_admin_create_invoice(uuid, text, int, date, uuid, uuid) to authenticated;
grant execute on function public.pk_admin_set_invoice_status(uuid, text, int) to authenticated;
grant execute on function public.pk_admin_set_subscription_status(uuid, text) to authenticated;
grant execute on function public.pk_admin_record_usage(uuid, text, int, uuid, text) to authenticated;
grant execute on function public.pk_admin_clients() to authenticated;

-- ============================================================
-- Storage: three private buckets, files foldered by client id
--   pk-attachments/<client_id>/<task public id>/<file>   (client uploads)
--   pk-brand-kits/<client_id>/<file>                     (client uploads)
--   pk-deliverables/<client_id>/<task public id>/<file>  (team uploads)
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('pk-attachments', 'pk-attachments', false),
  ('pk-brand-kits', 'pk-brand-kits', false),
  ('pk-deliverables', 'pk-deliverables', false)
on conflict (id) do nothing;

create policy "pk files readable by owner or admin" on storage.objects for select using (
  bucket_id in ('pk-attachments', 'pk-brand-kits', 'pk-deliverables')
  and ((auth.uid())::text = (storage.foldername(name))[1] or public.is_admin()));
create policy "pk client uploads" on storage.objects for insert with check (
  bucket_id in ('pk-attachments', 'pk-brand-kits') and (auth.uid())::text = (storage.foldername(name))[1]);
create policy "pk brand kit files deletable by owner" on storage.objects for delete using (
  bucket_id = 'pk-brand-kits' and (auth.uid())::text = (storage.foldername(name))[1]);
create policy "pk team uploads deliverables" on storage.objects for insert with check (
  bucket_id = 'pk-deliverables' and public.is_admin());
create policy "pk team manages pk files" on storage.objects for delete using (
  bucket_id in ('pk-attachments', 'pk-deliverables') and public.is_admin());
