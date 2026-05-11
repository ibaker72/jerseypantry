-- ============================================================
-- Receiving Sessions
-- Groups a batch of inventory_lots into one "shopping run"
-- (e.g. "Tuesday Restaurant Depot trip"). The unified receiving
-- UI scans items into an open session and finalizes when done.
-- ============================================================

create table if not exists public.receiving_sessions (
  id              uuid primary key default gen_random_uuid(),
  supplier_id     uuid references public.suppliers(id) on delete set null,
  status          text not null default 'open'
                    check (status in ('open', 'finalized', 'canceled')),
  notes           text,
  started_at      timestamptz not null default now(),
  finalized_at    timestamptz,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists receiving_sessions_status_idx     on public.receiving_sessions(status);
create index if not exists receiving_sessions_supplier_idx   on public.receiving_sessions(supplier_id);
create index if not exists receiving_sessions_started_idx    on public.receiving_sessions(started_at desc);

create trigger receiving_sessions_updated_at
  before update on public.receiving_sessions
  for each row execute function update_updated_at_column();

alter table public.receiving_sessions enable row level security;

create policy "receiving_sessions_admin_all" on public.receiving_sessions
  for all using (public.is_admin());

-- Tag each lot with the session it was received in.
alter table public.inventory_lots
  add column if not exists receiving_session_id uuid
  references public.receiving_sessions(id) on delete set null;

create index if not exists inventory_lots_session_idx
  on public.inventory_lots(receiving_session_id);

-- ── receive_lot RPC v2 — accepts session id ───────────────────
-- Drop the previous signature and re-create with an extra param.
drop function if exists public.receive_lot(uuid, uuid, int, numeric, text, date, text);

create or replace function public.receive_lot(
  p_product_id            uuid,
  p_supplier_id           uuid,
  p_quantity              int,
  p_unit_cost             numeric,
  p_lot_number            text,
  p_expiration_date       date,
  p_notes                 text,
  p_receiving_session_id  uuid default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_lot_id    uuid;
  v_user_id   uuid;
  v_total     numeric;
  v_supplier  uuid;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'quantity must be > 0';
  end if;

  v_user_id := auth.uid();
  v_total   := coalesce(p_unit_cost, 0) * p_quantity;
  v_supplier := p_supplier_id;

  -- If session is given but supplier is null, inherit session's supplier.
  if p_receiving_session_id is not null and v_supplier is null then
    select supplier_id into v_supplier
    from public.receiving_sessions
    where id = p_receiving_session_id;
  end if;

  insert into public.inventory_lots (
    product_id, supplier_id, quantity_received, quantity_remaining,
    unit_cost, total_cost, lot_number, expiration_date, notes,
    created_by, receiving_session_id
  )
  values (
    p_product_id, v_supplier, p_quantity, p_quantity,
    coalesce(p_unit_cost, 0), v_total, nullif(p_lot_number, ''),
    p_expiration_date, nullif(p_notes, ''),
    v_user_id, p_receiving_session_id
  )
  returning id into v_lot_id;

  update public.products
  set inventory_quantity = inventory_quantity + p_quantity
  where id = p_product_id;

  begin
    insert into public.inventory_movements (
      product_id, movement_type, quantity_change, note, created_by
    ) values (
      p_product_id, 'restock', p_quantity,
      'Lot ' || v_lot_id::text || coalesce(' · ' || p_notes, ''),
      v_user_id
    );
  exception
    when undefined_table then null;
    when undefined_column then null;
  end;

  return v_lot_id;
end;
$$;

grant execute on function public.receive_lot(uuid, uuid, int, numeric, text, date, text, uuid) to authenticated;

-- ── Finalize session helper ───────────────────────────────────
create or replace function public.finalize_receiving_session(p_session_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.receiving_sessions
  set status = 'finalized',
      finalized_at = coalesce(finalized_at, now())
  where id = p_session_id
    and status = 'open';
end;
$$;

grant execute on function public.finalize_receiving_session(uuid) to authenticated;
