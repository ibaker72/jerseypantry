-- ============================================================
-- Seed mock wholesale_inventory rows for every active product
-- that doesn't already have one. Pricing is formulaic so the
-- wholesale catalog has something to show during development —
-- replace with real wholesaler pricing per SKU when you have it.
--
-- Heuristic: wholesale_price = 65% of retail, case_size = 12.
-- All rows are tagged wholesaler_name = 'Mock' so they're easy
-- to filter / wipe before production.
-- ============================================================

insert into public.wholesale_inventory (
  product_id,
  wholesaler_name,
  wholesaler_stock,
  buffer_pct,
  wholesale_unit,
  unit_count,
  wholesale_price
)
select
  p.id,
  'Mock'                                    as wholesaler_name,
  coalesce(p.inventory_quantity, 0) * 4     as wholesaler_stock,
  0.20                                      as buffer_pct,
  'Case of 12'                              as wholesale_unit,
  12                                        as unit_count,
  round(p.retail_price * 0.65, 2)           as wholesale_price
from public.products p
left join public.wholesale_inventory wi on wi.product_id = p.id
where p.is_active = true
  and wi.id is null;

-- Backfill wholesale_price on any existing rows that don't have one.
update public.wholesale_inventory wi
set wholesale_price = round(p.retail_price * 0.65, 2)
from public.products p
where p.id = wi.product_id
  and wi.wholesale_price is null
  and p.retail_price > 0;
