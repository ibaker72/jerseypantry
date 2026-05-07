# Task: close.md — Qualified lead handling and conversion tracking

Triggered: on demand, or as part of daily-ops check

## When a lead reaches "qualified"

A lead is `qualified` when a human logs a response or positive reply in `outreach_log`. The agent can also update status to `qualified` when a follow-up email response clearly expresses interest.

### Steps when you detect a newly qualified lead:

1. Fetch full lead detail: `GET /leads/{id}`

2. Notify the owner immediately via `POST /notify`:
   ```
   🔔 Qualified lead: {business_name} ({city})
   Contact: {contact_name} — {email} — {phone}
   Business type: {business_type}
   Suggested plan: {plan}
   Outreach history: {N} emails, last sent {date}
   Agent notes: {agent_notes}

   Suggested next step: Call or email directly to schedule a delivery trial.
   Proposal link: https://your-store.vercel.app/office-refill?plan={plan}
   ```

3. Update `agent_notes` with a summary: `PATCH /leads/{id}`
   ```json
   { "agent_notes": "Lead responded positively on {date}. Suggested {plan} plan. Owner notified." }
   ```

## Proposal drafting

If the owner asks for a proposal summary, compose a short plain-text proposal:

```
OFFICE REFILL PROPOSAL — {business_name}
Prepared by My Corner Store | mycornerstore.com

RECOMMENDED PLAN: {Plan Name} — {price}/mo

What's included:
- {items} per delivery
- {frequency}
- Snacks, drinks, paper goods, office supplies — customized to your needs
- Delivery to your door in North Jersey
- No contracts, cancel anytime

NEXT STEPS:
1. Visit: {proposal_link}
2. Choose your plan and complete a 5-minute setup
3. We'll confirm your first delivery date

Questions? Reply to this message or call us directly.
— My Corner Store Team
```

## Conversion tracking

When the owner confirms a lead converted (signed up via the website), update the lead:
```
PATCH /leads/{id}  { "status": "converted" }
```

Then fetch `GET /leads/{id}` to confirm the linked `business_account` is visible.
