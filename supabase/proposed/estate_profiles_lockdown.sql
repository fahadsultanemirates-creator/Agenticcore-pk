-- ============================================================
-- PROPOSED — NOT APPLIED. Needs Fahad's OK, and belongs in the
-- agenticcore-estate repo's migrations, since it changes an estate table.
-- ------------------------------------------------------------
-- Problem found on 27 Sep 2026 in the shared project (iuwjlvcfnxbfhbkztsel):
-- the "profiles are updatable by owner" RLS policy has no column limits,
-- and the authenticated role holds UPDATE on every profiles column. So any
-- signed-in user can run, from the browser console:
--   supabaseClient.from('profiles').update({ role: 'admin', points: 999999 }).eq('id', <own id>)
-- and become an admin (is_admin() checks profiles.role) and mint points.
-- That breaks the admin gate for BOTH sites and the shared points balance.
--
-- Fix: take away blanket UPDATE and grant it back only on the columns a
-- user is allowed to edit themselves. Server-side code (security definer
-- functions, the dashboard's SQL editor) is unaffected.
-- Check estate's own pages still work after applying: they update
-- full_name, agency_*, builder_*, cnic, developer_status/tier,
-- referral_joined(_at) and seller_package from the browser.
-- developer_status / developer_tier / seller_package are left editable only
-- because estate currently sets them from the browser during the launch
-- window; move those writes into security-definer RPCs next, then drop them
-- from this list.
-- ============================================================

revoke update on public.profiles from anon, authenticated;

grant update (
  full_name,
  cnic,
  agency_name, agency_logo_path, agency_description,
  builder_company_name, builder_logo_path, builder_description, builder_projects_completed, builder_services,
  referral_joined, referral_joined_at,
  developer_status, developer_tier, seller_package
) on public.profiles to authenticated;

-- Never user-editable: id, phone (login identity), role, points,
-- referral_code, referred_by, created_at.
