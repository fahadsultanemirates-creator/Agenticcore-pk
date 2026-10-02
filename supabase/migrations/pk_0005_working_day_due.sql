-- AgenticCore Pakistan — task due dates count WORKING days (Catalogue V2 cleanup).
-- The site quotes delivery as working-day ranges ("2–3 working days"), so the
-- internal due date must never be shorter than that. Before this migration
-- pk_compute_due added calendar days, so a Friday order for a 3-day service was
-- due on Monday. Additive and idempotent; RLS, pricing and ownership checks are
-- unchanged.
--
-- The rule (all in Pakistan time, Asia/Karachi):
--   1. Start day = the day the task is confirmed; after the same-day cut-off
--      (pk_settings.cutoff_hour_pkt, default 18:00) it is the next day.
--   2. If the start day is not a working day, move to the next working day.
--   3. Add the service's turnaround as WORKING days (0 = same working day).
--   4. Due at pk_settings.due_hour_pkt (default 21:00) on that day.
--   Working days: pk_settings.working_dows (ISO day numbers, default Mon–Fri
--   [1,2,3,4,5]); dates listed in pk_settings.holidays_pkt (["2026-10-..."]) are
--   skipped too. When a paused task resumes, the paused time is added back and
--   the result is moved forward to the next working day if it lands on a
--   non-working day (never earlier).

insert into public.pk_settings (key, value) values
  ('working_dows', '[1, 2, 3, 4, 5]'),
  ('holidays_pkt', '[]')
on conflict (key) do nothing;

create or replace function public.pk_is_working_day(p_day date)
returns boolean language sql stable security definer set search_path = public as $$
  select extract(isodow from p_day)::int in (
           select jsonb_array_elements_text(coalesce((select value from public.pk_settings where key = 'working_dows'), '[1,2,3,4,5]'::jsonb))::int)
     and not exists (
           select 1 from jsonb_array_elements_text(coalesce((select value from public.pk_settings where key = 'holidays_pkt'), '[]'::jsonb)) h
           where h::date = p_day);
$$;

-- p_days working days after p_from's start day (see the rule above). 0 = the start day itself.
create or replace function public.pk_add_working_days(p_day date, p_days int)
returns date language plpgsql stable security definer set search_path = public as $$
declare
  d date := p_day;
  n int := 0;
  guard int := 0;
begin
  while not public.pk_is_working_day(d) loop
    d := d + 1; guard := guard + 1;
    if guard > 366 then raise exception 'No working day configured'; end if;
  end loop;
  while n < greatest(coalesce(p_days, 0), 0) loop
    d := d + 1;
    if public.pk_is_working_day(d) then n := n + 1; end if;
    guard := guard + 1;
    if guard > 3660 then raise exception 'No working day configured'; end if;
  end loop;
  return d;
end;
$$;

create or replace function public.pk_compute_due(p_from timestamptz, p_days int)
returns timestamptz language plpgsql stable security definer set search_path = public as $$
declare
  local_ts timestamp := p_from at time zone 'Asia/Karachi';
  base_date date;
begin
  if p_days is null then return null; end if;
  base_date := local_ts::date + case when extract(hour from local_ts) >= public.pk_setting_int('cutoff_hour_pkt', 18) then 1 else 0 end;
  return ((public.pk_add_working_days(base_date, p_days))::timestamp
          + make_interval(hours => public.pk_setting_int('due_hour_pkt', 21))) at time zone 'Asia/Karachi';
end;
$$;

-- A resumed task gets its paused time added back (pk_set_task_status). If that lands on a
-- weekend or holiday, move it forward to the same time on the next working day.
create or replace function public.pk_roll_due_to_working_day()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  local_ts timestamp;
  d date;
begin
  if new.due_at is not null and old.paused_at is not null and new.paused_at is null then
    local_ts := new.due_at at time zone 'Asia/Karachi';
    d := public.pk_add_working_days(local_ts::date, 0);
    if d <> local_ts::date then
      new.due_at := (d::timestamp + local_ts::time) at time zone 'Asia/Karachi';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists pk_tasks_due_working_day on public.pk_tasks;
create trigger pk_tasks_due_working_day before update of paused_at, due_at on public.pk_tasks
  for each row execute function public.pk_roll_due_to_working_day();

revoke all on function public.pk_is_working_day(date) from public, anon, authenticated;
revoke all on function public.pk_add_working_days(date, int) from public, anon, authenticated;
revoke all on function public.pk_roll_due_to_working_day() from public, anon, authenticated;
