# Task: prospect.md — Find and create new leads

Run on: Tue & Thu 10am | Max 5 leads per run

## Steps

1. Pick one business type and one city from the prospecting targets in config (rotate through them across runs to avoid repeating).

2. Search for real businesses of that type in that city. Use web search if available, or your training knowledge of North Jersey businesses. Collect:
   - Business name
   - Physical address
   - Website URL (if available)
   - A real, verifiable contact email (owner, manager, or general info@ address)

3. For each candidate, **verify the email exists** before proceeding:
   - Check the business website for a contact email
   - Only use emails you found on an official source (website, Google Business, LinkedIn)
   - Skip any business where you cannot find a verified email

4. Check for duplicates — call `GET /leads?search={business_name}` and `GET /leads?search={email}` before creating.

5. If not a duplicate and email is verified, call `POST /leads`:
   ```json
   {
     "business_name": "...",
     "email": "...",
     "contact_name": "...",
     "business_type": "gym",
     "city": "Clifton",
     "state": "NJ",
     "website": "https://...",
     "lead_source": "agent_prospected",
     "agent_notes": "Found via Google Maps. Owner: Jane Smith. Seems like a small 2-staff gym."
   }
   ```

6. Repeat for up to 5 leads total per run.

7. After the run, send a summary via `POST /notify`:
   ```
   Prospect sweep complete: 5 researched, 3 created, 2 skipped (1 duplicate, 1 no email found)
   New leads: Planet Fitness Clifton, Garfield Auto Group, ...
   ```

## Notes
- Prioritize businesses that look active (recent Google reviews, active website)
- Note anything useful in `agent_notes` — owner name, employee count, recent news
- Suggested plan by business type: auto_dealership→standard, gym→starter, barbershop→starter, medical_office→standard, corporate_office→premium
