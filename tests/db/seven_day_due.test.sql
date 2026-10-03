-- 7-day operation due dates (pk_0005). Pakistan time. 2026-10-02 is a Friday.
do $t$
declare
  r record; got timestamptz; want timestamptz;
  client uuid := 'a784f70c-a0ca-4229-8c2a-1a171a15ffca';
  admin uuid := 'b0000000-0000-0000-0000-00000000ad01';
  tid uuid; t pk_tasks; due0 timestamptz; due1 timestamptz;
begin
  if extract(isodow from date '2026-10-02') <> 5 then raise exception 'calendar assumption broken'; end if;
  for r in select * from (values
      -- confirmed at (PKT)   days  due (PKT)             case
      ('2026-10-02 10:00', 0, '2026-10-02 21:00', 'Friday before cut-off, same day'),
      ('2026-10-02 10:00', 1, '2026-10-03 21:00', 'Friday → Saturday'),
      ('2026-10-03 10:00', 1, '2026-10-04 21:00', 'Saturday → Sunday'),
      ('2026-10-04 10:00', 1, '2026-10-05 21:00', 'Sunday → Monday'),
      ('2026-10-02 10:00', 3, '2026-10-05 21:00', 'Friday 10am + 3 → Monday (crosses the weekend, every day counts)'),
      ('2026-10-02 19:00', 0, '2026-10-03 21:00', 'Friday 7pm, same-day service → Saturday'),
      ('2026-10-03 10:00', 0, '2026-10-03 21:00', 'same-day service on Saturday'),
      ('2026-10-04 10:00', 0, '2026-10-04 21:00', 'same-day service on Sunday'),
      ('2026-10-04 10:00', 2, '2026-10-06 21:00', 'Sunday 10am + 2 → Tuesday'),
      ('2026-10-01 17:59', 0, '2026-10-01 21:00', 'one minute before the 6pm cut-off: same day'),
      ('2026-10-01 18:00', 0, '2026-10-02 21:00', 'exactly 6pm: starts the next day'),
      ('2026-10-01 18:01', 2, '2026-10-04 21:00', 'after 6pm on Thursday + 2 → Sunday'),
      ('2026-10-03 23:30', 1, '2026-10-05 21:00', 'late Saturday night + 1 → Monday'),
      ('2026-10-05 10:00', 7, '2026-10-12 21:00', 'Monday + 7 → next Monday'),
      ('2026-10-02 10:00', 14, '2026-10-16 21:00', 'two weeks')
    ) v(at_pkt, days, due_pkt, why) loop
    got := public.pk_compute_due((r.at_pkt::timestamp) at time zone 'Asia/Karachi', r.days);
    want := (r.due_pkt::timestamp) at time zone 'Asia/Karachi';
    if got <> want then raise exception 'due wrong (%): got % want %', r.why, got at time zone 'Asia/Karachi', r.due_pkt; end if;
  end loop;
  if public.pk_compute_due(now(), null) is not null then raise exception 'null turnaround must give null due'; end if;
  if public.pk_compute_due(('2026-10-02 10:00'::timestamp) at time zone 'Asia/Karachi', -3) <> ('2026-10-02 21:00'::timestamp) at time zone 'Asia/Karachi'
    then raise exception 'negative turnaround must not move a deadline earlier'; end if;
  -- no weekend/holiday machinery left behind
  if exists (select 1 from pg_proc where proname in ('pk_is_working_day', 'pk_add_working_days', 'pk_roll_due_to_working_day')) then raise exception 'working-day functions must not exist'; end if;
  if exists (select 1 from pk_settings where key in ('working_dows', 'holidays_pkt')) then raise exception 'holiday settings must not exist'; end if;

  -- paused / resumed task through the real admin RPC: the pause is added back, never shortened
  insert into public.profiles (id, role) values (admin, 'admin') on conflict (id) do update set role = 'admin';
  perform set_config('request.jwt.claims', json_build_object('sub', client, 'role', 'authenticated')::text, true);
  select task_id into tid from public.pk_place_order('[{"line_id":"6-dfy"}]'::jsonb) limit 1;
  perform set_config('request.jwt.claims', json_build_object('sub', admin, 'role', 'authenticated')::text, true);
  t := public.pk_admin_set_status(tid, 'confirmed');
  due0 := t.due_at;
  if due0 <> public.pk_compute_due(now(), t.turnaround_days) then raise exception 'confirm did not use pk_compute_due'; end if;
  t := public.pk_admin_set_status(tid, 'waiting_on_you', 'need logo', array['Logo file']);
  if t.paused_at is null or t.due_at <> due0 then raise exception 'pause must stop the clock without moving the due time'; end if;
  update pk_tasks set paused_at = now() - interval '2 days 3 hours' where id = tid;   -- the client took 2 days 3 hours (over a weekend)
  t := public.pk_admin_set_status(tid, 'in_progress');
  due1 := t.due_at;
  if t.paused_at is not null then raise exception 'resume must clear the pause'; end if;
  if due1 < due0 then raise exception 'resume shortened the deadline'; end if;
  if due1 - due0 < interval '2 days 3 hours' or due1 - due0 > interval '2 days 3 hours 1 minute' then raise exception 'resume added % (want 2 days 3 hours)', due1 - due0; end if;
  -- confirming again later never recomputes an existing deadline
  t := public.pk_admin_set_status(tid, 'confirmed');
  if t.due_at <> due1 then raise exception 're-confirm changed an existing deadline'; end if;

  raise notice 'seven_day_due: all checks passed';
end $t$;
