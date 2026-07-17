alter table public.profiles
  alter column role type text using role::text;

alter table public.profiles
  alter column role set default 'manager';

drop type if exists public.user_role;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can view own profile or admin profiles" on public.profiles;
drop policy if exists "Users can update own profile or admin profiles" on public.profiles;
drop policy if exists "Admins can insert profiles" on public.profiles;
drop policy if exists "Authenticated users can view profiles" on public.profiles;
drop policy if exists "Authenticated users can update profiles" on public.profiles;
drop policy if exists "Authenticated users can insert profiles" on public.profiles;

create policy "Authenticated users can view profiles"
on public.profiles
for select
using (auth.role() = 'authenticated');

create policy "Authenticated users can update profiles"
on public.profiles
for update
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Authenticated users can insert profiles"
on public.profiles
for insert
with check (auth.role() = 'authenticated');

update public.profiles
set role = 'super_admin'
where lower(email) = lower('amanuelsahile2010@gmail.com');

update public.profiles
set role = 'manager'
where role is null or trim(role) = '';
