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

alter table public.cashier_bonos enable row level security;
alter table public.cashier_settings enable row level security;
alter table public.cashier_reports enable row level security;

create policy "Authenticated users can manage cashier bonos"
on public.cashier_bonos
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Authenticated users can manage cashier settings"
on public.cashier_settings
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Authenticated users can manage cashier reports"
on public.cashier_reports
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
