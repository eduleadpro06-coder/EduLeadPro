-- Migration: Add Meta Marketing Integration Tables
-- This migration creates all necessary tables for Meta (Facebook/Instagram) marketing integration

-- Step 1: Create meta_connections table (stores OAuth tokens per organization)
CREATE TABLE IF NOT EXISTS meta_connections (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMP,
  refresh_token TEXT,
  ad_account_id VARCHAR(255) NOT NULL,
  page_id VARCHAR(255),
  page_name VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id) -- One connection per organization
);

-- Step 2: Create meta_campaigns table
CREATE TABLE IF NOT EXISTS meta_campaigns (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  meta_campaign_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  objective VARCHAR(100) NOT NULL, -- AWARENESS, TRAFFIC, ENGAGEMENT, LEADS, SALES, etc.
  status VARCHAR(50) NOT NULL DEFAULT 'PAUSED', -- ACTIVE, PAUSED, DELETED, ARCHIVED
  daily_budget DECIMAL(10, 2),
  lifetime_budget DECIMAL(10, 2),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Step 3: Create meta_ad_sets table
CREATE TABLE IF NOT EXISTS meta_ad_sets (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id INTEGER NOT NULL REFERENCES meta_campaigns(id) ON DELETE CASCADE,
  meta_ad_set_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  targeting JSONB, -- Stores audience targeting configuration
  bid_amount DECIMAL(10, 2),
  optimization_goal VARCHAR(100), -- REACH, IMPRESSIONS, CLICKS, LEADS, etc.
  billing_event VARCHAR(100), -- IMPRESSIONS, CLICKS, etc.
  status VARCHAR(50) NOT NULL DEFAULT 'PAUSED',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Step 4: Create meta_ads table
CREATE TABLE IF NOT EXISTS meta_ads (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ad_set_id INTEGER NOT NULL REFERENCES meta_ad_sets(id) ON DELETE CASCADE,
  meta_ad_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  creative JSONB NOT NULL, -- Stores ad creative details (image, headline, text, etc.)
  status VARCHAR(50) NOT NULL DEFAULT 'PAUSED',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Step 5: Create meta_lead_forms table
CREATE TABLE IF NOT EXISTS meta_lead_forms (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  meta_form_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  questions JSONB NOT NULL, -- Array of form questions
  privacy_policy_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Step 6: Create meta_synced_leads table
CREATE TABLE IF NOT EXISTS meta_synced_leads (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  meta_lead_id VARCHAR(255) NOT NULL,
  crm_lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  form_id INTEGER REFERENCES meta_lead_forms(id) ON DELETE SET NULL,
  campaign_id INTEGER REFERENCES meta_campaigns(id) ON DELETE SET NULL,
  ad_id INTEGER REFERENCES meta_ads(id) ON DELETE SET NULL,
  raw_data JSONB NOT NULL, -- Original Meta lead data for reference
  synced_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, meta_lead_id) -- Prevent duplicate syncs
);

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_meta_connections_organization_id ON meta_connections(organization_id);
CREATE INDEX IF NOT EXISTS idx_meta_connections_is_active ON meta_connections(is_active);

CREATE INDEX IF NOT EXISTS idx_meta_campaigns_organization_id ON meta_campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_meta_campaign_id ON meta_campaigns(meta_campaign_id);
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_status ON meta_campaigns(status);

CREATE INDEX IF NOT EXISTS idx_meta_ad_sets_organization_id ON meta_ad_sets(organization_id);
CREATE INDEX IF NOT EXISTS idx_meta_ad_sets_campaign_id ON meta_ad_sets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_meta_ad_sets_meta_ad_set_id ON meta_ad_sets(meta_ad_set_id);

CREATE INDEX IF NOT EXISTS idx_meta_ads_organization_id ON meta_ads(organization_id);
CREATE INDEX IF NOT EXISTS idx_meta_ads_ad_set_id ON meta_ads(ad_set_id);
CREATE INDEX IF NOT EXISTS idx_meta_ads_meta_ad_id ON meta_ads(meta_ad_id);

CREATE INDEX IF NOT EXISTS idx_meta_lead_forms_organization_id ON meta_lead_forms(organization_id);
CREATE INDEX IF NOT EXISTS idx_meta_lead_forms_meta_form_id ON meta_lead_forms(meta_form_id);

CREATE INDEX IF NOT EXISTS idx_meta_synced_leads_organization_id ON meta_synced_leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_meta_synced_leads_crm_lead_id ON meta_synced_leads(crm_lead_id);
CREATE INDEX IF NOT EXISTS idx_meta_synced_leads_meta_lead_id ON meta_synced_leads(meta_lead_id);
CREATE INDEX IF NOT EXISTS idx_meta_synced_leads_synced_at ON meta_synced_leads(synced_at);

-- Step 8: Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_meta_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meta_connections_updated_at BEFORE UPDATE ON meta_connections
  FOR EACH ROW EXECUTE FUNCTION update_meta_updated_at();

CREATE TRIGGER meta_campaigns_updated_at BEFORE UPDATE ON meta_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_meta_updated_at();

CREATE TRIGGER meta_ad_sets_updated_at BEFORE UPDATE ON meta_ad_sets
  FOR EACH ROW EXECUTE FUNCTION update_meta_updated_at();

CREATE TRIGGER meta_ads_updated_at BEFORE UPDATE ON meta_ads
  FOR EACH ROW EXECUTE FUNCTION update_meta_updated_at();

CREATE TRIGGER meta_lead_forms_updated_at BEFORE UPDATE ON meta_lead_forms
  FOR EACH ROW EXECUTE FUNCTION update_meta_updated_at();
