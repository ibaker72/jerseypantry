# OpenClaw — My Corner Store Sales Agent

OpenClaw is the AI agent that handles daily ops monitoring and B2B sales prospecting for My Corner Store.

## What it does

- **Morning report** (Mon–Fri 8am) — revenue snapshot, alerts, B2B pipeline summary via Telegram
- **Weekly pipeline** (Monday 8am) — funnel conversion rates, hot leads, recommendations
- **Prospect sweep** (Tue & Thu 10am) — finds 5 North Jersey businesses, verifies emails, creates leads via API
- **Follow-up sweep** (Mon/Wed/Fri 9am) — sends 3/7/14-day follow-ups, marks dead after 3 unanswered or 30 days
- **Close assist** — notifies owner when a lead reaches "qualified", drafts proposals

## Setup

### 1. Apply the migration

```bash
supabase db push
# or apply supabase/migrations/006_phase6_sales_agent.sql manually
```

### 2. Set environment variables

Copy `.env.example` and fill in:

```
AGENT_API_KEY=<openssl rand -hex 32>
OPENCLAW_WEBHOOK_URL=<your OpenClaw instance webhook>
```

### 3. Configure OpenClaw

Copy `openclaw/config.example.yaml` → your OpenClaw config and set:

- `store_api_base`: your deployed store URL + `/api/agent`
- `agent_api_key`: same value as `AGENT_API_KEY` env var
- `telegram_chat_id`: your Telegram chat for notifications

### 4. Load prompts

In OpenClaw, set the system prompt to the contents of `openclaw/system-prompt.md`.

Load task files from `openclaw/tasks/` into the corresponding OpenClaw task slots.

### 5. Test the API

```bash
export KEY=your_agent_api_key
export BASE=https://your-store.com/api/agent

# Check manifest
curl -H "Authorization: Bearer $KEY" $BASE

# Check alerts
curl -H "Authorization: Bearer $KEY" $BASE/alerts

# Create a test lead
curl -X POST -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"business_name":"Test Gym","email":"test@example.com","business_type":"gym","city":"Clifton"}' \
  $BASE/leads

# Send initial outreach (replace LEAD_ID)
curl -X POST -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"lead_id":"LEAD_ID","type":"initial_outreach","plan_suggestion":"starter"}' \
  $BASE/outreach
```

## Lead Pipeline

```
new → contacted → qualified → proposal_sent → converted
                                           ↘ dead (any stage)
```

Status only advances forward. The agent uses `PATCH /leads/:id` to update status as conversations progress.
