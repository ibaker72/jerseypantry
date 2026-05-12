-- ============================================================
-- DoorDash Drive integration — last-mile delivery
-- ============================================================
-- Adds tracking columns to orders + delivery_logs for webhook
-- debugging. Realtime is enabled on orders so the tracker
-- component can subscribe to status changes.
-- ============================================================

alter table public.orders
  add column if not exists delivery_tracking_id text,
  add column if not exists delivery_status text
    constraint orders_delivery_status_check check (
      delivery_status is null or delivery_status in (
        'created',
        'quoted',
        'confirmed',
        'enroute_to_pickup',
        'arrived_at_pickup',
        'picked_up',
        'enroute_to_dropoff',
        'arrived_at_dropoff',
        'delivered',
        'canceled',
        'returned',
        'failed'
      )
    ),
  add column if not exists tracking_url text,
  add column if not exists delivery_provider text default 'doordash',
  add column if not exists delivery_provider_fee_cents int,
  add column if not exists delivery_updated_at timestamptz;

create index if not exists orders_delivery_tracking_id_idx
  on public.orders(delivery_tracking_id);

create index if not exists orders_delivery_status_idx
  on public.orders(delivery_status);

-- ============================================================
-- delivery_logs — every outbound call + inbound webhook
-- ============================================================
create table if not exists public.delivery_logs (
  id                   uuid primary key default gen_random_uuid(),
  order_id             uuid references public.orders(id) on delete cascade,
  delivery_tracking_id text,
  provider             text not null default 'doordash',
  direction            text not null
                         constraint delivery_logs_direction_check check (
                           direction in ('outbound', 'webhook')
                         ),
  event_type           text,
  status_code          int,
  request_payload      jsonb,
  response_payload     jsonb,
  error_message        text,
  created_at           timestamptz not null default now()
);

create index if not exists delivery_logs_order_id_idx
  on public.delivery_logs(order_id);

create index if not exists delivery_logs_tracking_id_idx
  on public.delivery_logs(delivery_tracking_id);

create index if not exists delivery_logs_created_at_idx
  on public.delivery_logs(created_at desc);

-- ============================================================
-- RLS — service role only for logs; orders RLS already covers tracking
-- ============================================================
alter table public.delivery_logs enable row level security;

create policy "delivery_logs_admin_read"
  on public.delivery_logs for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- ============================================================
-- Realtime — emit changes for live tracker UI
-- ============================================================
alter publication supabase_realtime add table public.orders;
