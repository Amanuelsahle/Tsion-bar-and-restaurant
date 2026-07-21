alter table public.cashier_settings
add column if not exists order_payload jsonb;
