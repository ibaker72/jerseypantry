-- ============================================================
-- Gated Wholesale Mode
--
-- Approved business users toggle "Wholesale Mode" on the retail
-- front-end and see case pricing + delivery promise inline on the
-- normal shop pages. Unapproved users see retail behavior; the
-- wholesale_price column is hidden via a view that nulls it out
-- when the caller is not wholesale-approved.
-- ============================================================

-- 1. Add wholesale_price to existing wholesale_inventory table.
--    (Reuses unit_count as case_size; reuses wholesale_unit as label.)
alter table public.wholesale_inventory
  add column if not exists wholesale_price numeric(10,2);

-- 2. Approval flag on business accounts.
alter table public.business_accounts
  add column if not exists is_wholesale_approved boolean not null default false;

-- 3. Helper: is the calling user wholesale-approved?
--    SECURITY DEFINER so callers can pass auth.uid() without triggering
--    RLS recursion on business_members / business_accounts.
create or replace function public.is_wholesale_approved(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members bm
    join public.business_accounts ba on ba.id = bm.business_id
    where bm.user_id = uid
      and bm.accepted_at is not null
      and ba.is_wholesale_approved = true
      and ba.status = 'active'
      and ba.subscription_status = 'active'
  );
$$;

grant execute on function public.is_wholesale_approved(uuid) to authenticated, anon;

-- 4. Lightweight velocity lookup. Extract verdict-only from the heavier
--    get_sku_velocity_ranking so per-page-render isn't recomputing the
--    full weekly pivot.
create or replace function public.get_product_velocity()
returns table (product_id uuid, recommendation text)
language sql
stable
security definer
set search_path = public
as $$
  select product_id, recommendation
  from public.get_sku_velocity_ranking(28, 5, 3);
$$;

grant execute on function public.get_product_velocity() to authenticated, anon;

-- 5. View: products joined with wholesale fields, gated by approval.
--    security_invoker so RLS on products / wholesale_inventory still
--    applies. case-when nulls wholesale columns for non-approved sessions
--    as defense in depth.
create or replace view public.products_with_wholesale
with (security_invoker = on) as
select
  p.*,
  case when public.is_wholesale_approved(auth.uid())
       then wi.wholesale_price end as wholesale_price,
  case when public.is_wholesale_approved(auth.uid())
       then wi.unit_count end       as case_size,
  case when public.is_wholesale_approved(auth.uid())
       then wi.wholesale_unit end   as wholesale_unit
from public.products p
left join public.wholesale_inventory wi on wi.product_id = p.id
where p.is_active = true;

grant select on public.products_with_wholesale to authenticated, anon;

-- 6. Tighten wholesale_inventory member-read policy: only approved members.
drop policy if exists "wi_member_read" on public.wholesale_inventory;
create policy "wi_approved_member_read" on public.wholesale_inventory
  for select using (public.is_wholesale_approved(auth.uid()));
