# Script: weekly-pipeline.md — Monday 8am weekly pipeline summary

Compose a slightly longer Telegram message with funnel metrics for the past week.

## Data to collect

1. `GET /leads?status=new&limit=200` — count new leads this week (`created_at >= 7 days ago`)
2. `GET /leads?status=contacted&limit=200`
3. `GET /leads?status=qualified&limit=200`
4. `GET /leads?status=converted&limit=200`
5. `GET /leads?status=dead&limit=200`
6. `GET /metrics` — for B2B revenue context

## Message template

---

**MY CORNER STORE — Weekly Pipeline**
Week of {Monday date}

**FUNNEL THIS WEEK**
New leads created: {new_this_week}
Initial outreach sent: {contacted_this_week}
Qualified (responded): {qualified_this_week}
Converted to B2B: {converted_this_week}
Marked dead: {dead_this_week}

**CONVERSION RATES**
Contact → Qualified: {pct}%
Qualified → Converted: {pct}%
Overall: {pct}%

**HOT LEADS (qualified, not yet converted)**
{FOR each qualified lead}
🔔 {business_name} ({city}) — {business_type} — contacted {N} days ago
{/FOR}
{IF none} None currently qualified{/IF}

**PROPOSAL PIPELINE**
Proposal sent, awaiting reply: {proposal_sent_count}
{list business names}

**RECOMMENDATIONS**
{Based on the data, write 2-3 actionable bullets:}
- e.g. "Low conversion from contacted→qualified. Consider a different subject line or custom hook approach."
- e.g. "3 qualified leads haven't been contacted by owner in 5+ days. Follow up today."
- e.g. "Barbershops converting at 2x rate vs gyms. Increase barbershop prospecting."

---

**Formatting rules:**
- Conversion rates: show 0% if denominator is 0 (don't divide by zero)
- List up to 5 qualified leads by name; if more say "and N more"
- Recommendations should be specific and actionable, not generic
- Keep under 50 lines
