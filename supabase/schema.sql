create extension if not exists "pgcrypto";

create type public.user_role as enum ('manager', 'bar_manager');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role public.user_role not null default 'bar_manager',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  quantity_per_box integer not null default 24,
  unit_price numeric(12,2) not null default 0,
  current_boxes integer not null default 0,
  min_threshold integer not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  movement_type text not null check (movement_type in ('in','out')),
  boxes integer not null default 0,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.distributions (
  id uuid primary key default gen_random_uuid(),
  distribution_date date not null,
  bar_manager_id uuid not null references auth.users(id) on delete restrict,
  grand_total numeric(12,2) not null default 0,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

create table if not exists public.distribution_items (
  id uuid primary key default gen_random_uuid(),
  distribution_id uuid not null references public.distributions(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  boxes integer not null default 0,
  quantity_per_box integer not null default 0,
  unit_price numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public, auth
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'bar_manager')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.stock_movements enable row level security;
alter table public.distributions enable row level security;
alter table public.distribution_items enable row level security;

create policy "Users can view own profile" on public.profiles
for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
for update using (auth.uid() = id);

create policy "Authenticated users can manage products" on public.products
for all using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Authenticated users can manage stock movements" on public.stock_movements
for all using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Authenticated users can manage distributions" on public.distributions
for all using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Authenticated users can manage distribution items" on public.distribution_items
for all using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Bar managers can view their own distributions" on public.distributions
for select using (
  auth.uid() = bar_manager_id
);

create policy "Bar managers can view their own distribution items" on public.distribution_items
for select using (
  exists (
    select 1 from public.distributions d
    where d.id = distribution_id and d.bar_manager_id = auth.uid()
  )
);
