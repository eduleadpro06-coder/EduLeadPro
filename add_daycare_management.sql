-- Daycare Management System - Complete Standalone Module
-- This migration creates all tables needed for the daycare management system
-- Author: EduLeadPro Development Team
-- Date: 2025-12-27

-- =====================================================
-- 1. DAYCARE CHILDREN - Complete child information
-- =====================================================
CREATE TABLE IF NOT EXISTS daycare_children (
  id SERIAL PRIMARY KEY,
  child_id VARCHAR(50) UNIQUE NOT NULL,
  child_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  age_years INTEGER,
  age_months INTEGER,
  gender VARCHAR(10),
  blood_group VARCHAR(10),
  photo_url TEXT,
  
  -- Parent/Guardian Information
  parent_name VARCHAR(100) NOT NULL,
  parent_phone VARCHAR(20) NOT NULL,
  parent_email VARCHAR(255),
  alternate_phone VARCHAR(20),
  
  -- Address
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  
  -- Emergency Contact
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relation VARCHAR(50),
  
  -- Medical Information
  allergies TEXT,
  medical_conditions TEXT,
  special_needs TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, graduated
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP
);

-- =====================================================
-- 2. DAYCARE INQUIRIES - Lead management for daycare
-- =====================================================
CREATE TABLE IF NOT EXISTS daycare_inquiries (
  id SERIAL PRIMARY KEY,
  inquiry_number VARCHAR(50) UNIQUE NOT NULL,
  child_name VARCHAR(100) NOT NULL,
  child_age_years INTEGER,
  child_age_months INTEGER,
  
  parent_name VARCHAR(100) NOT NULL,
  parent_phone VARCHAR(20) NOT NULL,
  parent_email VARCHAR(255),
  
  preferred_start_date DATE,
  preferred_timings VARCHAR(50), -- full-day, half-day, hourly
  source VARCHAR(100), -- website, referral, walk-in, etc.
  
  status VARCHAR(20) DEFAULT 'new', -- new, contacted, visited, enrolled, dropped
  assigned_to INTEGER REFERENCES users(id),
  priority VARCHAR(20) DEFAULT 'medium', -- high, medium, low
  
  notes TEXT,
  follow_up_date DATE,
  last_contacted_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- =====================================================
-- 3. DAYCARE INQUIRY FOLLOW-UPS - Follow-up tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS daycare_inquiry_followups (
  id SERIAL PRIMARY KEY,
  inquiry_id INTEGER REFERENCES daycare_inquiries(id) NOT NULL,
  
  scheduled_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  
  followup_type VARCHAR(30), -- call, visit, email, whatsapp
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, cancelled
  
  notes TEXT,
  outcome VARCHAR(30), -- interested, not_interested, enrolled, need_more_info
  next_action TEXT,
  
  assigned_to INTEGER REFERENCES users(id),
  completed_by INTEGER REFERENCES users(id),
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- =====================================================
-- 4. DAYCARE BILLING CONFIG - Pricing rules
-- =====================================================
CREATE TABLE IF NOT EXISTS daycare_billing_config (
  id SERIAL PRIMARY KEY,
  config_name VARCHAR(100) NOT NULL,
  
  -- Hourly rates
  hourly_rate DECIMAL(10, 2),
  min_hourly_charge_minutes INTEGER DEFAULT 60,
  
  -- Half-day rates
  half_day_rate DECIMAL(10, 2),
  half_day_hours INTEGER DEFAULT 4,
  
  -- Full-day rates
  full_day_rate DECIMAL(10, 2),
  full_day_hours INTEGER DEFAULT 8,
  
  -- Monthly plans
  monthly_unlimited_rate DECIMAL(10, 2),
  
  -- Late pickup
  grace_period_minutes INTEGER DEFAULT 15,
  late_pickup_charge_per_hour DECIMAL(10, 2),
  
  -- Registration
  registration_fee DECIMAL(10, 2),
  
  -- Other
  security_deposit DECIMAL(10, 2),
  
  is_active BOOLEAN DEFAULT true,
  effective_from DATE,
  effective_until DATE,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- =====================================================
-- 5. DAYCARE ENROLLMENTS - Active enrollments
-- =====================================================
CREATE TABLE IF NOT EXISTS daycare_enrollments (
  id SERIAL PRIMARY KEY,
  child_id INTEGER REFERENCES daycare_children(id) NOT NULL,
  enrollment_number VARCHAR(50) UNIQUE NOT NULL,
  enrollment_date DATE NOT NULL,
  
  billing_plan_id INTEGER REFERENCES daycare_billing_config(id),
  custom_hourly_rate DECIMAL(10, 2),
  custom_half_day_rate DECIMAL(10, 2),
  custom_full_day_rate DECIMAL(10, 2),
  custom_monthly_rate DECIMAL(10, 2),
  
  status VARCHAR(20) DEFAULT 'active', -- active, paused, cancelled, completed
  start_date DATE NOT NULL,
  end_date DATE,
  
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted_at TIMESTAMP
);

-- =====================================================
-- 6. DAYCARE ATTENDANCE - Check-in/out records
-- =====================================================
CREATE TABLE IF NOT EXISTS daycare_attendance (
  id SERIAL PRIMARY KEY,
  enrollment_id INTEGER REFERENCES daycare_enrollments(id) NOT NULL,
  attendance_date DATE NOT NULL,
  
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
  check_out_time TIMESTAMP WITH TIME ZONE,
  
  duration_minutes INTEGER,
  billing_type VARCHAR(20), -- hourly, half-day, full-day, monthly
  calculated_charge DECIMAL(10, 2),
  
  checked_in_by INTEGER REFERENCES users(id),
  checked_out_by INTEGER REFERENCES users(id),
  
  notes TEXT,
  is_manual_edit BOOLEAN DEFAULT false,
  edited_by INTEGER REFERENCES users(id),
  edit_reason TEXT,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- =====================================================
-- 7. DAYCARE PAYMENTS - Separate payment tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS daycare_payments (
  id SERIAL PRIMARY KEY,
  payment_number VARCHAR(50) UNIQUE NOT NULL,
  child_id INTEGER REFERENCES daycare_children(id) NOT NULL,
  enrollment_id INTEGER REFERENCES daycare_enrollments(id),
  
  payment_type VARCHAR(30), -- attendance, monthly_plan, registration, late_fee
  billing_period_start DATE,
  billing_period_end DATE,
  
  amount DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  late_fee DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  
  payment_date DATE NOT NULL,
  payment_mode VARCHAR(30), -- cash, card, upi, bank_transfer, cheque
  transaction_id VARCHAR(100),
  cheque_number VARCHAR(50),
  
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, refunded
  receipt_number VARCHAR(50) UNIQUE,
  
  collected_by INTEGER REFERENCES users(id),
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- =====================================================
-- INDEXES for performance optimization
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_daycare_children_parent_phone ON daycare_children(parent_phone);
CREATE INDEX IF NOT EXISTS idx_daycare_children_status ON daycare_children(status);
CREATE INDEX IF NOT EXISTS idx_daycare_children_deleted_at ON daycare_children(deleted_at);

CREATE INDEX IF NOT EXISTS idx_daycare_inquiries_status ON daycare_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_daycare_inquiries_assigned_to ON daycare_inquiries(assigned_to);
CREATE INDEX IF NOT EXISTS idx_daycare_inquiries_follow_up_date ON daycare_inquiries(follow_up_date);

CREATE INDEX IF NOT EXISTS idx_daycare_enrollments_child_id ON daycare_enrollments(child_id);
CREATE INDEX IF NOT EXISTS idx_daycare_enrollments_status ON daycare_enrollments(status);

CREATE INDEX IF NOT EXISTS idx_daycare_attendance_enrollment_id ON daycare_attendance(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_daycare_attendance_date ON daycare_attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_daycare_attendance_check_out ON daycare_attendance(check_out_time);

CREATE INDEX IF NOT EXISTS idx_daycare_payments_child ON daycare_payments(child_id);
CREATE INDEX IF NOT EXISTS idx_daycare_payments_date ON daycare_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_daycare_payments_status ON daycare_payments(status);

CREATE INDEX IF NOT EXISTS idx_daycare_followups_inquiry ON daycare_inquiry_followups(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_daycare_followups_scheduled ON daycare_inquiry_followups(scheduled_at);

-- =====================================================
-- SEED DATA - Default billing configuration
-- =====================================================
INSERT INTO daycare_billing_config (
  config_name,
  hourly_rate,
  min_hourly_charge_minutes,
  half_day_rate,
  half_day_hours,
  full_day_rate,
  full_day_hours,
  monthly_unlimited_rate,
  grace_period_minutes,
  late_pickup_charge_per_hour,
  registration_fee,
  security_deposit,
  is_active,
  effective_from
) VALUES (
  'Default Daycare Pricing',
  100.00,  -- ₹100 per hour
  60,      -- Minimum 1 hour charge
  350.00,  -- ₹350 for half day
  4,       -- Half day = 4 hours
  600.00,  -- ₹600 for full day
  8,       -- Full day = 8 hours
  12000.00, -- ₹12,000 monthly unlimited
  15,      -- 15 minutes grace period
  50.00,   -- ₹50 per hour late pickup charge
  1000.00, -- ₹1,000 registration fee
  2000.00, -- ₹2,000 security deposit
  true,
  CURRENT_DATE
) ON CONFLICT DO NOTHING;

-- =====================================================
-- COMMENTS for documentation
-- =====================================================
COMMENT ON TABLE daycare_children IS 'Complete child information for daycare program - independent from student records';
COMMENT ON TABLE daycare_inquiries IS 'Lead management system for daycare inquiries';
COMMENT ON TABLE daycare_inquiry_followups IS 'Follow-up tracking for daycare inquiries';
COMMENT ON TABLE daycare_billing_config IS 'Configurable pricing rules for daycare services';
COMMENT ON TABLE daycare_enrollments IS 'Active enrollment records linking children to daycare program';
COMMENT ON TABLE daycare_attendance IS 'Daily check-in/check-out records with automatic charge calculation';
COMMENT ON TABLE daycare_payments IS 'Payment tracking system for daycare - separate from student fees';
