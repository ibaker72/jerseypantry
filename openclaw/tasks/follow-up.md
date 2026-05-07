# Task: follow-up.md — Follow-up cadence and dead-lead cleanup

Run on: Mon/Wed/Fri 9am

## Follow-up cadence

Send follow-ups at 3, 7, and 14 days after last contact. After 3 unanswered emails or 30+ days since first contact with no response, mark the lead `dead`.

## Steps

1. Fetch all leads with status `contacted`:
   ```
   GET /leads?status=contacted&limit=100
   ```

2. For each lead, check `outreach_log` to determine:
   - How many emails have been sent
   - Date of the last outreach
   - Whether any response has been logged (`response_received_at` not null)

3. **If lead has a response** → skip (owner or human should handle qualified leads manually; agent can update status to `qualified` if the response is clearly interested)

4. **If 3+ emails sent with no response, OR last email was 30+ days ago** → mark dead:
   ```
   PATCH /leads/{id}  { "status": "dead", "agent_notes": "3 unanswered emails over 30 days — marking dead." }
   ```

5. **If last email was 3, 7, or 14 days ago** (within ±1 day window) → send follow-up:
   ```
   POST /outreach  { "lead_id": "...", "type": "follow_up", "plan_suggestion": "...", "sent_by": "agent" }
   ```

6. Send summary via `POST /notify`:
   ```
   Follow-up sweep:
   - 4 follow-up emails sent (3-day: 2, 7-day: 1, 14-day: 1)
   - 2 leads marked dead (3 unanswered emails)
   - 1 lead skipped (response detected — needs owner review)
   ```

## Notes
- The API enforces 20h cooldown — don't retry if you get a 429
- If a lead has 1 email sent and it's been < 3 days, skip it (not time yet)
- Leads where the human team has logged a `call` or `note` type entry in outreach_log should be skipped — the human is handling it
