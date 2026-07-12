drop policy if exists "Authenticated users can manage products" on public.products;
drop policy if exists "Authenticated users can manage stock movements" on public.stock_movements;
drop policy if exists "Authenticated users can manage distributions" on public.distributions;
drop policy if exists "Authenticated users can manage distribution items" on public.distribution_items;

drop policy if exists "Managers can manage products" on public.products;
drop policy if exists "Managers can manage stock movements" on public.stock_movements;
drop policy if exists "Managers can manage distributions" on public.distributions;
drop policy if exists "Managers can manage distribution items" on public.distribution_items;

create policy "Authenticated users can manage products"
on public.products
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Authenticated users can manage stock movements"
on public.stock_movements
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Authenticated users can manage distributions"
on public.distributions
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

create policy "Authenticated users can manage distribution items"
on public.distribution_items
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
