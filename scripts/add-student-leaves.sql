-- Migration: Add student_leaves table
-- Created: 2026-08-29
-- Purpose: Allow parents to apply for leaves for their enrolled children

CREATE TABLE IF NOT EXISTS student_leaves (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES leads(id),
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  rejection_reason TEXT,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by student
CREATE INDEX IF NOT EXISTS idx_student_leaves_student_id ON student_leaves(student_id);

-- Index for fast lookup by organization
CREATE INDEX IF NOT EXISTS idx_student_leaves_organization_id ON student_leaves(organization_id);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_student_leaves_status ON student_leaves(status);
