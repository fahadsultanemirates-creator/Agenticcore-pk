-- ============================================================
-- pk_0006 — AgenticCore Pakistan orders through the Telegram bot (Phase 2)
--
-- The bot (@AgenticcoreEstatebot, Netlify function, service role) places
-- and manages orders for the person it has identified from their verified
-- Telegram account. Everything goes through the existing pk_* functions,
-- so prices, task IDs, timelines, invoices, revisions and notifications
-- work exactly as on the website:
--   * pk_tg_place_order / pk_tg_client run the client RPCs as that person
--     (callable by the server only, never from the website).
--   * The owner approves each order in Telegram: the bot calls the admin
--     RPCs with the service role, which pk_require_admin now accepts.
--   * pk_work_jobs tracks who is doing the work (Grok image / Grok video /
--     Grok agent / the team) and holds drafts until the owner approves the
--     delivery.
-- Additive: no price, catalogue, referral or RLS rule changes.
-- ============================================================

-- 1. admin RPCs: admins, or the server (service role) acting for the owner
create or replace function public.pk_require_admin()
returns void language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.is_admin()
          or coalesce(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'role', '') = 'service_role') then
    raise exception 'Admins only' using errcode = '42501';
  end if;
end;
$$;

-- 2. run a client RPC as the person the bot identified (server only).
-- The claims are set for this transaction only, so auth.uid() inside the
-- existing functions is that person and every ownership check still applies.
create or replace function public.pk_tg_as(p_client uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'role', '') <> 'service_role' then
    raise exception 'Server only' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = p_client) then
    raise exception 'Unknown account' using errcode = '42501';
  end if;
  perform set_config('request.jwt.claims', json_build_object('sub', p_client, 'role', 'authenticated')::text, true);
end;
$$;

create or replace function public.pk_tg_place_order(p_client uuid, p_items jsonb)
returns table (task_id uuid, public_id text, invoice_number text)
language plpgsql security definer set search_path = public as $$
begin
  perform public.pk_tg_as(p_client);
  return query select * from public.pk_place_order(p_items, 'telegram');
end;
$$;

-- p_action: details | attach | message | approve | changes | cancel
create or replace function public.pk_tg_client(
  p_client uuid, p_action text, p_task uuid,
  p_note text default null, p_details jsonb default null, p_path text default null, p_name text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r smallint;
begin
  perform public.pk_tg_as(p_client);
  if p_action = 'details' then perform public.pk_add_details(p_task, coalesce(p_details, '{}'::jsonb), p_note);
  elsif p_action = 'attach' then perform public.pk_register_attachment(p_task, p_path, p_name);
  elsif p_action = 'message' then perform public.pk_post_message(p_task, p_note);
  elsif p_action = 'approve' then perform public.pk_approve_delivery(p_task);
  elsif p_action = 'changes' then r := public.pk_request_changes(p_task, p_note, p_path);
  elsif p_action = 'cancel' then perform public.pk_cancel_task(p_task);
  else raise exception 'Unknown action %', p_action;
  end if;
  return jsonb_build_object('ok', true, 'round', r);
end;
$$;

revoke execute on function public.pk_tg_as(uuid) from public, anon, authenticated;
revoke execute on function public.pk_tg_place_order(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.pk_tg_client(uuid, text, uuid, text, jsonb, text, text) from public, anon, authenticated;
grant execute on function public.pk_tg_place_order(uuid, jsonb) to service_role;
grant execute on function public.pk_tg_client(uuid, text, uuid, text, jsonb, text, text) to service_role;

-- 3. who is doing the work, and drafts waiting for the owner's approval
create table if not exists public.pk_work_jobs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.pk_tasks(id) on delete cascade,
  worker text not null check (worker in ('grok_image', 'grok_video', 'grok_agent', 'team')),
  status text not null default 'queued' check (status in (
    'queued',             -- waiting for a worker
    'running',            -- a worker has it (Grok video rendering, agent or team working)
    'awaiting_approval',  -- draft files ready; the owner decides
    'approved',           -- delivered to the client
    'rejected',           -- owner turned the draft down
    'failed')),
  brief text,
  provider_job_id text,
  outputs jsonb not null default '[]'::jsonb,   -- [{path, kind, label}] in pk-deliverables
  note text,
  attempts smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists pk_work_jobs_status_idx on public.pk_work_jobs(status, worker, created_at);
create index if not exists pk_work_jobs_task_idx on public.pk_work_jobs(task_id, created_at desc);
alter table public.pk_work_jobs enable row level security;
revoke all on public.pk_work_jobs from public, anon, authenticated;
grant all on public.pk_work_jobs to service_role;
grant select on public.pk_work_jobs to authenticated;
drop policy if exists "work jobs admins only" on public.pk_work_jobs;
create policy "work jobs admins only" on public.pk_work_jobs for select using (public.is_admin());
