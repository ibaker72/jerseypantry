-- ============================================================
-- Phase 6: OpenClaw — AI ops agent tracking
-- ============================================================

-- Extend office_refill_leads with OpenClaw lifecycle columns
alter table public.office_refill_leads
  add column if not exists source           text not null default 'manual'
    check (source in ('manual', 'openclaw_sweep')),
  add column if not exists last_contacted_at timestamptz,
  add column if not exists follow_up_count  int not null default 0,
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists dead_reason      text,
  add column if not exists notes            text,
  add column if not exists qualified_at     timestamptz,
  add column if not exists updated_at       timestamptz not null default now();

-- Widen status to include full pipeline stages
alter table public.office_refill_leads
  drop constraint if exists office_refill_leads_status_check;

alter table public.office_refill_leads
  add constraint office_refill_leads_status_check
    check (status in ('new', 'contacted', 'qualified', 'converted', 'dead'));

-- Keep updated_at current
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger office_refill_leads_updated_at
  before update on public.office_refill_leads
  for each row execute function public.set_updated_at();

-- When a lead is marked qualified, stamp qualified_at automatically
create or replace function public.stamp_qualified_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'qualified' and old.status <> 'qualified' then
    new.qualified_at = now();
  end if;
  return new;
end;
$$;

create trigger office_refill_leads_qualified_at
  before update on public.office_refill_leads
  for each row execute function public.stamp_qualified_at();

-- Indexes for OpenClaw queries
create index if not exists orl_status_idx           on public.office_refill_leads(status);
create index if not exists orl_next_follow_up_idx   on public.office_refill_leads(next_follow_up_at)
  where status in ('new', 'contacted');
create index if not exists orl_source_idx           on public.office_refill_leads(source);
