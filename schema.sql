-- =====================================================
-- CCMS AI Judgment Extractor - Database Schema
-- Author: Tanya
-- Branch: database
-- Description: Core tables for the Court Case
-- Monitoring System. Stores judgment details,
-- AI extracted actions, human review audit trail,
-- and raw Claude API responses.
-- =====================================================

CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number TEXT NOT NULL UNIQUE,
  parties_involved TEXT,
  petitioner TEXT,
  respondent TEXT,
  cis_id TEXT,
  bench TEXT,
  pages INT,
  source_type TEXT CHECK (source_type IN ('Digital PDF', 'Scanned PDF + OCR')),
  risk TEXT CHECK (risk IN ('Critical', 'High', 'Medium')),
  next_hearing_date DATE,
  order_date DATE,
  judge_name TEXT,
  legal_sections TEXT[],
  directions TEXT[],
  summary TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  department TEXT,
  nodal_officer TEXT,
  responsible_office TEXT,
  action_required TEXT,
  source_text_quote TEXT,
  is_appeal_recommended BOOLEAN DEFAULT false,
  deadline DATE,
  limitation_period_days INT,
  limitation_date DATE,
  timeline_basis TEXT,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  confidence_score FLOAT CHECK (confidence_score BETWEEN 0 AND 1),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  bbox_page INT,
  bbox_x0 FLOAT, bbox_y0 FLOAT,
  bbox_x1 FLOAT, bbox_y1 FLOAT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE action_plan_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  action_id UUID REFERENCES actions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  owner TEXT NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'Ready' CHECK (status IN ('Ready', 'In Progress', 'Blocked', 'Queued')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ai_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  raw_response JSONB,
  prompt_version TEXT,
  model_used TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action_type TEXT CHECK (action_type IN ('Approved', 'Rejected', 'Edited', 'Status Update', 'Created', 'Deleted')),
  previous_state JSONB,
  new_state JSONB,
  updated_by TEXT,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON actions
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_plan_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON cases FOR ALL USING (true);
CREATE POLICY "allow_all" ON actions FOR ALL USING (true);
CREATE POLICY "allow_all" ON action_plan_steps FOR ALL USING (true);
CREATE POLICY "allow_all" ON ai_responses FOR ALL USING (true);
CREATE POLICY "allow_all" ON audit_logs FOR ALL USING (true);

CREATE INDEX idx_actions_case_id ON actions(case_id);
CREATE INDEX idx_action_plan_steps_case_id ON action_plan_steps(case_id);
CREATE INDEX idx_action_plan_steps_action_id ON action_plan_steps(action_id);
CREATE INDEX idx_ai_responses_case_id ON ai_responses(case_id);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
