-- Runs on the V1 (production) catalogue BEFORE the V2 upgrade: creates history that
-- references lines and packages V2 retires, so the upgrade can prove it keeps them.
do $t$
declare uid uuid := 'a784f70c-a0ca-4229-8c2a-1a171a15ffca';
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  perform public.pk_place_order('[{"line_id":"29-event","details":{"note":"V1 balloting order"}}]'::jsonb);
  perform public.pk_place_order('[{"line_id":"9-dfy"}]'::jsonb);
  perform public.pk_buy_package('dealer-starter', true);
end $t$;
