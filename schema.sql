-- ===========================================
-- CCMS AI Judgment Extractor - Database Schema
-- Author: Tanya
-- Description: Core tables for storing court
-- cases, AI extracted actions, audit trail,
-- and raw AI responses for the CCMS system
-- ===========================================


-- Cases table: stores core judgment details
-- fetched from High Court CIS integration
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number TEXT NOT NULL UNIQUE,
  parties_involved TEXT,
  next_hearing_date DATE,
  judge_name TEXT,
  legal_sections TEXT[],
  summary TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Actions table: stores AI extracted directives
-- from each judgment with human review status.
-- bbox columns store PDF coordinates for
-- highlighting source text in the review UI.
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  department TEXT,
  action_required TEXT,
  deadline DATE,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  confidence_score FLOAT CHECK (confidence_score BETWEEN 0 AND 1),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  bbox_page INT,
  bbox_x0 FLOAT, bbox_y0 FLOAT,
  bbox_x1 FLOAT, bbox_y1 FLOAT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
