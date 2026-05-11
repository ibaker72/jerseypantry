-- ============================================================
-- Stock Requests
-- Lets shoppers ask for products we don't carry yet, plus
-- "notify me when back in stock" for known SKUs that are zero.
-- ============================================================

create table if not exists public.stock_requests (
  id              uuid primary key default gen_random_uuid(),
  -- if a known product is out of stock, link it. Otherwise free-text.
  product_id      uuid references public.products(id) on delete set null,
  product_name    text not null,
  brand           text,
  size            text,
  notes           text,
  -- so we can ping the requester when we source it
  email           text,
  phone           text,
  -- where the request came from on the site
  source          text not null default 'storefront'
                    check (source in ('storefront', 'product_page', 'search', 'admin')),
  status          text not null default 'new'
                    check (status in ('new', 'reviewing', 'sourced', 'declined')),
  request_count   int not null default 1,
  admin_notes     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists stock_requests_status_idx     on public.stock_requests(status);
create index if not exists stock_requests_product_id_idx on public.stock_requests(product_id);
create index if not exists stock_requests_created_at_idx on public.stock_requests(created_at desc);

create trigger stock_requests_updated_at
  before update on public.stock_requests
  for each row execute function update_updated_at_column();

alter table public.stock_requests enable row level security;

-- Anyone (including anon) can submit a request.
create policy "stock_requests_public_insert" on public.stock_requests
  for insert with check (true);

-- Only admins can read or modify.
create policy "stock_requests_admin_all" on public.stock_requests
  for all using (public.is_admin());
