-- Minimal stand-ins for the Supabase auth/storage schema and the shared Estate tables,
-- so the pk_* migrations can be tested on a plain local Postgres. Test data only.
do $$ begin create role anon; exception when others then null; end $$; do $$ begin create role authenticated; exception when others then null; end $$; do $$ begin create role service_role; exception when others then null; end $$;
create schema auth; create schema storage;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claims', true)::json->>'sub','')::uuid $$;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text, owner uuid);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name, '/') $$;
create table public.profiles (id uuid primary key, role text default 'buyer', full_name text, phone text, email text, points integer default 0, referred_by uuid, referral_code text, agency_name text, created_at timestamptz default now());
create table public.listings (id uuid primary key default gen_random_uuid(), owner_id uuid references public.profiles(id), title text);
create function public.is_admin() returns boolean language sql stable as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;
insert into public.profiles (id) values ('a784f70c-a0ca-4229-8c2a-1a171a15ffca');
insert into public.listings (id, owner_id, title) values ('11111111-1111-1111-1111-111111111111', 'a784f70c-a0ca-4229-8c2a-1a171a15ffca', 'own listing');
