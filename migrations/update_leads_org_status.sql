-- Update all leads to assign organization ID 60 and set status to 'new'

BEGIN;

-- Count leads before update
DO $$
DECLARE
    total_leads INTEGER;
    leads_without_org INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_leads FROM leads;
    SELECT COUNT(*) INTO leads_without_org FROM leads WHERE organization_id IS NULL;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'UPDATING LEADS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total leads: %', total_leads;
    RAISE NOTICE 'Leads without organization: %', leads_without_org;
    RAISE NOTICE '========================================';
END $$;

-- Update all leads
UPDATE leads 
SET 
    organization_id = 60,
    status = 'new'
WHERE id IS NOT NULL;

-- Verify updates
DO $$
DECLARE
    total_leads INTEGER;
    leads_with_org_60 INTEGER;
    leads_with_new_status INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_leads FROM leads;
    SELECT COUNT(*) INTO leads_with_org_60 FROM leads WHERE organization_id = 60;
    SELECT COUNT(*) INTO leads_with_new_status FROM leads WHERE status = 'new';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'UPDATE COMPLETED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total leads: %', total_leads;
    RAISE NOTICE 'Leads with organization ID 60: %', leads_with_org_60;
    RAISE NOTICE 'Leads with status "new": %', leads_with_new_status;
    RAISE NOTICE '========================================';
    
    IF leads_with_org_60 = total_leads AND leads_with_new_status = total_leads THEN
        RAISE NOTICE 'SUCCESS: All leads updated successfully!';
    ELSE
        RAISE EXCEPTION 'ERROR: Some leads were not updated. Rolling back.';
    END IF;
END $$;

-- Commit the changes
COMMIT;
