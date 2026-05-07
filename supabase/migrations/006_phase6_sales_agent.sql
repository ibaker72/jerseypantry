-- Phase 6: Sales Agent — lead pipeline + outreach logging
-- ============================================================

-- 1. Expand office_refill_leads with full pipeline fields
ALTER TABLE office_refill_leads
  ADD COLUMN IF NOT EXISTS lead_source       TEXT    NOT NULL DEFAULT 'organic'
                                              CHECK (lead_source IN ('organic','agent_prospected','referral','social')),
  ADD COLUMN IF NOT EXISTS address           TEXT,
  ADD COLUMN IF NOT EXISTS city              TEXT,
  ADD COLUMN IF NOT EXISTS state             TEXT    DEFAULT 'NJ',
  ADD COLUMN IF NOT EXISTS postal_code       TEXT,
  ADD COLUMN IF NOT EXISTS website           TEXT,
  ADD COLUMN IF NOT EXISTS notes             TEXT,
  ADD COLUMN IF NOT EXISTS agent_notes       TEXT,
  ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Drop old status constraint and replace with full pipeline
ALTER TABLE office_refill_leads
  DROP CONSTRAINT IF EXISTS office_refill_leads_status_check;

ALTER TABLE office_refill_leads
  ADD CONSTRAINT office_refill_leads_status_check
  CHECK (status IN ('new','contacted','qualified','proposal_sent','converted','dead'));

-- updated_at trigger on office_refill_leads
CREATE TRIGGER set_office_refill_leads_updated_at
  BEFORE UPDATE ON office_refill_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Outreach log table
CREATE TABLE IF NOT EXISTS outreach_log (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id               UUID        NOT NULL REFERENCES office_refill_leads(id) ON DELETE CASCADE,
  type                  TEXT        NOT NULL CHECK (type IN ('email','sms','call','note')),
  subject               TEXT,
  body_summary          TEXT,
  sent_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_by               TEXT        NOT NULL DEFAULT 'agent' CHECK (sent_by IN ('agent','human')),
  response_received_at  TIMESTAMPTZ,
  resend_message_id     TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS outreach_log_lead_id_idx ON outreach_log(lead_id);
CREATE INDEX IF NOT EXISTS outreach_log_sent_at_idx ON outreach_log(sent_at DESC);

-- 3. RLS
ALTER TABLE outreach_log ENABLE ROW LEVEL SECURITY;

-- Admins have full access
CREATE POLICY "admin_all_outreach_log" ON outreach_log
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Service role (agent API) has write access (bypasses RLS by default)
-- No additional policy needed for service role

-- 4. Also add RLS allow for admin on expanded leads columns (already covered by existing policies)
-- Ensure agent_notes and lead_source are selectable by admin
-- (existing office_refill_leads admin RLS covers all columns)
