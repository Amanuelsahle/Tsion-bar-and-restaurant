alter table public.cashier_bonos
add column if not exists category text not null default 'regular';

update public.cashier_bonos
set category = 'regular'
where category is null or category = '';
