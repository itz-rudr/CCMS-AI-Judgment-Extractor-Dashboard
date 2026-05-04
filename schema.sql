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

