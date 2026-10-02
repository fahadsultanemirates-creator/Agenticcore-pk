-- Working-day due dates (pk_0005). Dates are Pakistan time. 2026-10-02 is a Friday.
do $t$
declare
  r record; got timestamptz; want timestamptz; d int; dow int; start timestamptz; cal timestamptz;
  uid uuid := 'a784f70c-a0ca-4229-8c2a-1a171a15ffca'; tid uuid;
begin
  if extract(isodow from date '2026-10-02') <> 5 then raise exception 'calendar assumption broken'; end if;
  for r in select * from (values
      -- confirmed at (PKT)          days  due (PKT, 21:00)            why
      ('2026-10-02 10:00', 0, '2026-10-02 21:00', 'Friday before cut-off, same day'),
      ('2026-10-02 10:00', 1, '2026-10-05 21:00', 'Friday + 1 working day = Monday'),
      ('2026-10-02 10:00', 3, '2026-10-07 21:00', 'Friday + 3 = Wednesday (calendar would give Monday)'),
      ('2026-10-02 19:00', 0, '2026-10-05 21:00', 'Friday after 6pm cut-off: Saturday, rolled to Monday'),
      ('2026-10-02 19:00', 2, '2026-10-07 21:00', 'Friday after cut-off + 2 = Wednesday'),
      ('2026-10-03 10:00', 0, '2026-10-05 21:00', 'Saturday order: Monday'),
      ('2026-10-04 15:00', 2, '2026-10-07 21:00', 'Sunday order + 2 = Wednesday'),
      ('2026-10-05 10:00', 5, '2026-10-12 21:00', 'Monday + 5 = next Monday'),
      ('2026-10-05 10:00', 10, '2026-10-19 21:00', 'Monday + 10 = two weeks later'),
      ('2026-10-01 17:59', 0, '2026-10-01 21:00', 'one minute before cut-off'),
      ('2026-10-01 18:00', 0, '2026-10-02 21:00', 'exactly at cut-off: next working day')
    ) v(at_pkt, days, due_pkt, why) loop
    got := public.pk_compute_due((r.at_pkt::timestamp) at time zone 'Asia/Karachi', r.days);
    want := (r.due_pkt::timestamp) at time zone 'Asia/Karachi';
    if got <> want then raise exception 'due wrong (%): got % want %', r.why, got at time zone 'Asia/Karachi', r.due_pkt; end if;
  end loop;
  if public.pk_compute_due(now(), null) is not null then raise exception 'null turnaround must give null due'; end if;

  -- never earlier than the old calendar-day rule, for every weekday start and 0..15 days
  for dow in 0..6 loop for d in 0..15 loop
    start := (('2026-10-05 10:00'::timestamp) + make_interval(days => dow)) at time zone 'Asia/Karachi';
    cal := (((start at time zone 'Asia/Karachi')::date + d)::timestamp + interval '21 hours') at time zone 'Asia/Karachi';
    got := public.pk_compute_due(start, d);
    if got < cal then raise exception 'working-day due earlier than calendar rule (dow %, days %)', dow, d; end if;
    if not public.pk_is_working_day((got at time zone 'Asia/Karachi')::date) then raise exception 'due on a non-working day (dow %, days %)', dow, d; end if;
  end loop; end loop;

  -- public holidays are skipped
  update pk_settings set value = '["2026-10-05"]' where key = 'holidays_pkt';
  got := public.pk_compute_due(('2026-10-02 10:00'::timestamp) at time zone 'Asia/Karachi', 1);
  if got <> ('2026-10-06 21:00'::timestamp) at time zone 'Asia/Karachi' then raise exception 'holiday not skipped: %', got at time zone 'Asia/Karachi'; end if;
  update pk_settings set value = '[]' where key = 'holidays_pkt';

  -- a six-day week is a setting, not a code change
  update pk_settings set value = '[1,2,3,4,5,6]' where key = 'working_dows';
  got := public.pk_compute_due(('2026-10-02 10:00'::timestamp) at time zone 'Asia/Karachi', 1);
  if got <> ('2026-10-03 21:00'::timestamp) at time zone 'Asia/Karachi' then raise exception 'six-day week wrong'; end if;
  update pk_settings set value = '[1,2,3,4,5]' where key = 'working_dows';

  -- a resumed task whose due time lands on a weekend moves to the next working day (never earlier)
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  select task_id into tid from public.pk_place_order('[{"line_id":"p-flyer"}]'::jsonb) limit 1;
  update pk_tasks set paused_at = now(), due_at = ('2026-10-02 21:00'::timestamp) at time zone 'Asia/Karachi' where id = tid;
  update pk_tasks set paused_at = null, due_at = ('2026-10-03 12:30'::timestamp) at time zone 'Asia/Karachi' where id = tid;
  select due_at into got from pk_tasks where id = tid;
  if got <> ('2026-10-05 12:30'::timestamp) at time zone 'Asia/Karachi' then raise exception 'resume on Saturday not rolled: %', got at time zone 'Asia/Karachi'; end if;
  update pk_tasks set paused_at = now() where id = tid;
  update pk_tasks set paused_at = null, due_at = ('2026-10-06 12:30'::timestamp) at time zone 'Asia/Karachi' where id = tid;
  select due_at into got from pk_tasks where id = tid;
  if got <> ('2026-10-06 12:30'::timestamp) at time zone 'Asia/Karachi' then raise exception 'weekday resume must not move'; end if;

  raise notice 'working_days: all checks passed';
end $t$;
