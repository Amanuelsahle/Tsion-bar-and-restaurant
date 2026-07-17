create extension if not exists "pgcrypto";

create type public.user_role as enum ('manager', 'bar_manager', 'admin', 'super_admin');

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

create table if not exists public.cashier_bonos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  quantity integer not null default 0,
  price numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cashier_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cashier_reports (
  id uuid primary key default gen_random_uuid(),
  cashier_name text not null,
  initial_money numeric(12,2) not null default 0,
  net_bono_value numeric(12,2) not null default 0,
  final_balance numeric(12,2) not null default 0,
  special_payouts numeric(12,2) not null default 0,
  today_money numeric(12,2) not null default 0,
  balance_check numeric(12,2) not null default 0,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
alter table public.cashier_bonos enable row level security;
alter table public.cashier_settings enable row level security;
alter table public.cashier_reports enable row level security;

create policy "Users can view own profile" on public.profiles
for select using (
  auth.uid() = id
  or exists (
    select 1 from public.profiles as viewer_profile
    where viewer_profile.id = auth.uid()
      and viewer_profile.role in ('admin', 'super_admin')
  )
);

create policy "Users can update own profile" on public.profiles
for update using (
  auth.uid() = id
  or exists (
    select 1 from public.profiles as updater_profile
    where updater_profile.id = auth.uid()
      and updater_profile.role = 'super_admin'
  )
)
with check (
  auth.uid() = id
  or exists (
    select 1 from public.profiles as updater_profile
    where updater_profile.id = auth.uid()
      and updater_profile.role = 'super_admin'
  )
);

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

create policy "Authenticated users can manage cashier bonos" on public.cashier_bonos
for all using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Authenticated users can manage cashier settings" on public.cashier_settings
for all using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Authenticated users can manage cashier reports" on public.cashier_reports
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
