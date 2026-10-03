-- AgenticCore Pakistan — task due dates: 7-day operation (Catalogue V2).
-- AgenticCore Pakistan delivers 7 days a week, so every calendar day counts:
-- no weekend or public-holiday exclusions, and no holiday calendar to maintain.
-- This restates pk_compute_due (pk_0001) with the rule written out and a guard
-- against negative turnarounds. Additive and idempotent; tables, RLS, pricing
-- and ownership checks are unchanged.
--
-- The rule (Pakistan time, Asia/Karachi):
--   1. Start day = the calendar day the task is confirmed. Confirmed at or after
--      the cut-off (pk_settings.cutoff_hour_pkt, default 18:00) → the next day.
--   2. Due day = start day + the service's turnaround in calendar days
--      (0 = same-day service, due on the start day).
--   3. Due at pk_settings.due_hour_pkt (default 21:00) on the due day.
--   Examples: Fri 10:00 + 3 → Mon 21:00 · Fri 19:00 + 0 → Sat 21:00 ·
--             Sat 10:00 + 0 → Sat 21:00 · Sun 10:00 + 2 → Tue 21:00.
--   Paused tasks (pk_admin_set_status): "waiting on you" stops the clock; on
--   resume the paused time is added back to the existing due time, so a
--   promised deadline only ever moves later, never earlier.

create or replace function public.pk_compute_due(p_from timestamptz, p_days int)
returns timestamptz language plpgsql stable security definer set search_path = public as $$
declare
  local_ts timestamp := p_from at time zone 'Asia/Karachi';
  start_day date;
begin
  if p_days is null then return null; end if;
  start_day := local_ts::date
             + case when extract(hour from local_ts) >= public.pk_setting_int('cutoff_hour_pkt', 18) then 1 else 0 end;
  return ((start_day + greatest(p_days, 0))::timestamp
          + make_interval(hours => public.pk_setting_int('due_hour_pkt', 21))) at time zone 'Asia/Karachi';
end;
$$;
