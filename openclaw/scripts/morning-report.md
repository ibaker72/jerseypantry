# Script: morning-report.md — Mon–Fri 8am Telegram message template

Compose a concise Telegram message using this structure. Use plain text (no markdown headers — Telegram renders them literally).

---

**MY CORNER STORE — Morning Report**
{Day}, {Date} | {time} ET

**REVENUE**
Today so far: ${today_revenue}
This week: ${week_revenue}

**ORDERS**
Pending: {pending_orders} | Processing: {processing_orders}
{IF stale_pending > 0} ⚠️ {stale_pending} order(s) stuck pending 1h+ — check admin{/IF}

**INVENTORY ALERTS**
{IF critical_stock_alerts > 0}
🔴 Out of stock: {list of 0-stock items}
{/IF}
{IF warning_stock_alerts > 0}
🟡 Low stock (<5): {list of low items with quantities}
{/IF}
{IF no_stock_alerts} ✅ All stock levels OK{/IF}

**B2B**
Active accounts: {active_b2b_count}
{IF overdue_invoices > 0} 🔴 {overdue_invoices} overdue invoice(s) — action needed{/IF}
{IF past_due_accounts > 0} 🔴 {past_due_accounts} past-due subscription(s){/IF}

**SALES PIPELINE**
New leads (uncontacted): {new_leads_count}
In follow-up: {contacted_leads_count}
{IF qualified_leads}
🔔 HOT: {list qualified lead names} — owner action needed
{/IF}

**ABANDONED CARTS**
{IF abandoned_carts > 0} {abandoned_carts} cart(s) need recovery email{/IF}
{IF no_abandoned_carts} None{/IF}

---
{IF no_critical_alerts} ✅ No critical issues — good morning!{/IF}

---

**Formatting rules:**
- Keep it under 40 lines — this is a Telegram message
- List item names directly, don't just say "N items" for critical alerts
- If the API call failed, write: "⚠️ Could not fetch [section] — check API"
- Qualified leads get their own line: "🔔 [Business Name] ([city]) — call/email today"
