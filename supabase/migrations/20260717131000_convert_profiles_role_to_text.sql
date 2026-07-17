alter table public.profiles
  alter column role type text using role::text;

alter table public.profiles
  alter column role set default 'manager';

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('manager', 'bar_manager', 'admin', 'super_admin'));

drop policy if exists "Users can view own profile or admin profiles" on public.profiles;
drop policy if exists "Users can update own profile or admin profiles" on public.profiles;
drop policy if exists "Admins can insert profiles" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

drop type if exists public.user_role;

drop policy if exists "Users can view own profile or admin profiles" on public.profiles;

drop policy if exists "Users can update own profile or admin profiles" on public.profiles;

create policy "Users can view own profile or admin profiles"
on public.profiles
for select
using (
  auth.uid() = id
  or exists (
    select 1
    from public.profiles as profile_role_check
    where profile_role_check.id = auth.uid()
      and profile_role_check.role in ('admin', 'super_admin')
  )
);

create policy "Users can update own profile or admin profiles"
on public.profiles
for update
using (
  auth.uid() = id
  or exists (
    select 1
    from public.profiles as profile_role_check
    where profile_role_check.id = auth.uid()
      and profile_role_check.role in ('admin', 'super_admin')
  )
)
with check (
  auth.uid() = id
  or exists (
    select 1
    from public.profiles as profile_role_check
    where profile_role_check.id = auth.uid()
      and profile_role_check.role in ('admin', 'super_admin')
  )
);

create policy "Admins can insert profiles"
on public.profiles
for insert
with check (
  exists (
    select 1
    from public.profiles as profile_role_check
    where profile_role_check.id = auth.uid()
      and profile_role_check.role in ('admin', 'super_admin')
  )
);

update public.profiles
set role = 'super_admin'
where lower(email) = lower('amanuelsahile2010@gmail.com');
