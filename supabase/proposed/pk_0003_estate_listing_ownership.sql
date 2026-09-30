-- ============================================
-- pk_0003 (PROPOSED — NOT APPLIED; needs owner approval)
-- Server-side guard for the Estate → PK handoff.
--
-- The browser only prefills a marketing pack from a listing whose
-- owner_id is the signed-in user, and the admin task view flags a
-- mismatch. This trigger makes the rule impossible to bypass from a
-- hand-crafted pk_place_order call: a client-created task may only
-- reference an Estate listing that client owns. Team-created tasks
-- (source = 'admin') are not restricted.
--
-- Additive: one function + one trigger. No existing table, policy,
-- RPC, price or referral rule changes.
-- ============================================

create or replace function public.pk_check_estate_listing_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text := new.details ->> 'estate_listing_id';
begin
  if v_id is null or new.source = 'admin' then
    return new;
  end if;
  if v_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'Invalid Estate listing reference' using errcode = '22023';
  end if;
  if not exists (select 1 from public.listings l where l.id = v_id::uuid and l.owner_id = new.client_id) then
    raise exception 'That Estate listing is not in your account' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke execute on function public.pk_check_estate_listing_owner() from public, anon, authenticated;

drop trigger if exists pk_tasks_estate_listing_owner on public.pk_tasks;
create trigger pk_tasks_estate_listing_owner
  before insert or update of details on public.pk_tasks
  for each row execute function public.pk_check_estate_listing_owner();
