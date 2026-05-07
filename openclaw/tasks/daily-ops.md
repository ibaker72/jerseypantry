# Task: daily-ops.md — Morning ops report

Run on: Mon–Fri 8am ET

## Steps

1. Call `GET /metrics` — get revenue and order snapshot
2. Call `GET /alerts` — get all actionable alerts
3. Call `GET /leads?status=new&limit=5` — count new uncontacted leads
4. Call `GET /leads?status=contacted&limit=50` — count leads in follow-up
5. Call `GET /leads?status=qualified&limit=10` — list hot leads needing attention

6. Compose the morning report (see `scripts/morning-report.md` for template)

7. Send via `POST /notify`:
   ```json
   { "message": "<composed report>", "channel": "telegram" }
   ```

## Notes
- If there are critical alerts (severity=critical), lead the report with those
- If there are qualified leads, highlight them by name
- Keep the report concise — it's a Telegram message, not a novel
- If metrics or alerts fail (API error), note that in the report rather than skipping
