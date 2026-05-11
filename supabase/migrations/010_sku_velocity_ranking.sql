-- ============================================================
-- SKU Velocity Ranking
--
-- Surfaces which products earn a "stocked" shelf slot and which
-- should stay virtual (pick-up-on-order). A product graduates to
-- stock_now when it has sold at least p_min_weekly_units for
-- p_consecutive_weeks weeks in a row.
--
-- Also folds in subscription-locked demand from b2b_plan_items so
-- recurring office-refill orders don't get classified as long-tail
-- when their orders haven't fired yet.
-- ============================================================

create or replace function public.get_sku_velocity_ranking(
  p_window_days       int default 28,
  p_min_weekly_units  int default 5,
  p_consecutive_weeks int default 3
)
returns table (
  product_id                 uuid,
  product_name               text,
  sku                        text,
  category_name              text,
  retail_price               numeric,
  wholesale_cost             numeric,
  margin_per_unit            numeric,
  margin_pct                 numeric,
  inventory_quantity         int,
  units_w1                   int,
  units_w2                   int,
  units_w3                   int,
  units_w4                   int,
  units_total                int,
  revenue_total              numeric,
  margin_total               numeric,
  subscription_monthly_units int,
  consecutive_weeks_above    int,
  recommendation             text
)
language sql
stable
security definer
set search_path = public
as $$
  with
  weeks as (
    select
      oi.product_id,
      width_bucket(
        extract(epoch from (now() - o.created_at)) / 86400,
        0, p_window_days, p_window_days / 7
      ) as week_bucket,
      oi.quantity,
      oi.line_total,
      p.wholesale_cost
    from order_items oi
    join orders o on o.id = oi.order_id
    left join products p on p.id = oi.product_id
    where
      oi.product_id is not null
      and o.created_at >= now() - make_interval(days => p_window_days)
      and o.status not in ('cancelled', 'pending')
  ),
  weekly as (
    select
      product_id,
      sum(case when week_bucket = 1 then quantity else 0 end)::int as units_w1,
      sum(case when week_bucket = 2 then quantity else 0 end)::int as units_w2,
      sum(case when week_bucket = 3 then quantity else 0 end)::int as units_w3,
      sum(case when week_bucket = 4 then quantity else 0 end)::int as units_w4,
      sum(quantity)::int                                            as units_total,
      sum(line_total)::numeric                                      as revenue_total,
      sum(quantity * coalesce(wholesale_cost, 0))::numeric          as cogs_total
    from weeks
    group by product_id
  ),
  sub_demand as (
    -- monthly units locked in by active business subscriptions
    select
      bpi.product_id,
      sum(bpi.quantity * coalesce(active_subs.n, 0))::int as monthly_units
    from b2b_plan_items bpi
    left join (
      select plan_name, count(*)::int as n
      from business_accounts
      where subscription_status = 'active' and status = 'active'
      group by plan_name
    ) active_subs on active_subs.plan_name = bpi.plan_name
    group by bpi.product_id
  )
  select
    p.id                                                    as product_id,
    p.name                                                  as product_name,
    p.sku,
    c.name                                                  as category_name,
    p.retail_price,
    p.wholesale_cost,
    (p.retail_price - p.wholesale_cost)                     as margin_per_unit,
    case
      when p.retail_price > 0
        then round(((p.retail_price - p.wholesale_cost) / p.retail_price) * 100, 1)
      else 0
    end                                                     as margin_pct,
    p.inventory_quantity,
    coalesce(w.units_w1, 0)                                 as units_w1,
    coalesce(w.units_w2, 0)                                 as units_w2,
    coalesce(w.units_w3, 0)                                 as units_w3,
    coalesce(w.units_w4, 0)                                 as units_w4,
    coalesce(w.units_total, 0)                              as units_total,
    coalesce(w.revenue_total, 0)                            as revenue_total,
    coalesce(w.revenue_total, 0) - coalesce(w.cogs_total, 0) as margin_total,
    coalesce(sd.monthly_units, 0)                           as subscription_monthly_units,
    -- count consecutive weeks (starting from most-recent w1) >= threshold
    (
      case when coalesce(w.units_w1, 0) >= p_min_weekly_units then 1 else 0 end
      +
      case when coalesce(w.units_w1, 0) >= p_min_weekly_units
            and coalesce(w.units_w2, 0) >= p_min_weekly_units then 1 else 0 end
      +
      case when coalesce(w.units_w1, 0) >= p_min_weekly_units
            and coalesce(w.units_w2, 0) >= p_min_weekly_units
            and coalesce(w.units_w3, 0) >= p_min_weekly_units then 1 else 0 end
      +
      case when coalesce(w.units_w1, 0) >= p_min_weekly_units
            and coalesce(w.units_w2, 0) >= p_min_weekly_units
            and coalesce(w.units_w3, 0) >= p_min_weekly_units
            and coalesce(w.units_w4, 0) >= p_min_weekly_units then 1 else 0 end
    )                                                       as consecutive_weeks_above,
    case
      -- subscription-locked demand alone justifies stocking
      when coalesce(sd.monthly_units, 0) >= p_min_weekly_units * 4 then 'stock_now'
      -- graduation rule: N units/week for K consecutive weeks
      when (
        case when coalesce(w.units_w1, 0) >= p_min_weekly_units then 1 else 0 end
        +
        case when coalesce(w.units_w1, 0) >= p_min_weekly_units
              and coalesce(w.units_w2, 0) >= p_min_weekly_units then 1 else 0 end
        +
        case when coalesce(w.units_w1, 0) >= p_min_weekly_units
              and coalesce(w.units_w2, 0) >= p_min_weekly_units
              and coalesce(w.units_w3, 0) >= p_min_weekly_units then 1 else 0 end
        +
        case when coalesce(w.units_w1, 0) >= p_min_weekly_units
              and coalesce(w.units_w2, 0) >= p_min_weekly_units
              and coalesce(w.units_w3, 0) >= p_min_weekly_units
              and coalesce(w.units_w4, 0) >= p_min_weekly_units then 1 else 0 end
      ) >= p_consecutive_weeks then 'stock_now'
      -- consistent but below the bar: keep watching
      when coalesce(w.units_total, 0) >= p_min_weekly_units then 'watch'
      else 'virtual'
    end                                                     as recommendation
  from products p
  left join categories c on c.id = p.category_id
  left join weekly w     on w.product_id = p.id
  left join sub_demand sd on sd.product_id = p.id
  where p.is_active = true
  order by
    case
      when coalesce(sd.monthly_units, 0) >= p_min_weekly_units * 4 then 0
      else 1
    end,
    (coalesce(w.revenue_total, 0) - coalesce(w.cogs_total, 0)) desc nulls last,
    coalesce(w.units_total, 0) desc;
$$;

grant execute on function public.get_sku_velocity_ranking(int, int, int) to authenticated;
