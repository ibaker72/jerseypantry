# Task: outreach.md — Initial outreach to new leads

Run on: part of follow-up sweep | Max 10 emails per run

## Steps

1. Fetch all leads with status `new`:
   ```
   GET /leads?status=new&limit=20
   ```

2. For each lead (up to 10 per run):

   a. Review `agent_notes` and `website` to craft a specific `custom_hook` — one sentence that references something real about the business. Examples:
      - "I saw you just opened a second location in Garfield — congrats!"
      - "With 12 service bays, your team deserves a stocked break room."
      - "Your Google reviews mention staff being super helpful — that kind of culture starts with people feeling taken care of."

   b. Pick the appropriate `plan_suggestion` based on `business_type`:
      - `auto_dealership` → `standard`
      - `gym` → `starter`
      - `barbershop` → `starter`
      - `medical_office` → `standard`
      - `corporate_office` → `premium`
      - unknown → `standard`

   c. Call `POST /outreach`:
      ```json
      {
        "lead_id": "...",
        "type": "initial_outreach",
        "plan_suggestion": "standard",
        "custom_hook": "Your team of 8 techs puts in long days — we make sure there's always something in the break room.",
        "sent_by": "agent"
      }
      ```

3. Log a summary via `POST /notify`:
   ```
   Initial outreach sent to 8 leads:
   - Garfield Auto Group (standard plan)
   - Clifton Cuts barbershop (starter plan)
   - ...
   ```

## Notes
- Skip any lead where you cannot write a genuine, specific custom_hook — generic outreach performs worse
- The API enforces 20h cooldown between emails; if you get a 429, skip that lead
- Do not contact leads with status `dead` or `converted`
