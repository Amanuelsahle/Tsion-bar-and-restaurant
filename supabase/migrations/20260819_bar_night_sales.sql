-- Create bar_items catalog table
create table if not exists public.bar_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit_price numeric(12,2) not null default 0,
  category text default 'bar',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create bar_night_sales header table
create table if not exists public.bar_night_sales (
  id uuid primary key default gen_random_uuid(),
  sale_date date not null default current_date,
  shift_name text default 'Night Shift',
  grand_total numeric(12,2) not null default 0,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Create bar_night_sale_items line items table
create table if not exists public.bar_night_sale_items (
  id uuid primary key default gen_random_uuid(),
  night_sale_id uuid not null references public.bar_night_sales(id) on delete cascade,
  item_id uuid references public.bar_items(id) on delete set null,
  item_name text not null,
  unit_price numeric(12,2) not null default 0,
  quantity numeric(12,2) not null default 0,
  total_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.bar_items enable row level security;
alter table public.bar_night_sales enable row level security;
alter table public.bar_night_sale_items enable row level security;

-- Policies for bar_items
create policy "Authenticated users can manage bar items" on public.bar_items
for all using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- Policies for bar_night_sales
create policy "Authenticated users can manage bar night sales" on public.bar_night_sales
for all using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- Policies for bar_night_sale_items
create policy "Authenticated users can manage bar night sale items" on public.bar_night_sale_items
for all using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
