-- =====================================================
-- COMPLETE DATABASE DATA CLEANUP
-- This script deletes ALL data from ALL tables
-- Only the database schema (table structures) will remain
-- =====================================================

BEGIN;

-- Display counts before deletion
DO $$
DECLARE
    total_users INTEGER;
    total_orgs INTEGER;
    total_leads INTEGER;
    total_students INTEGER;
    total_staff INTEGER;
    total_daycare INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM users;
    SELECT COUNT(*) INTO total_orgs FROM organizations;
    SELECT COUNT(*) INTO total_leads FROM leads;
    SELECT COUNT(*) INTO total_students FROM students;
    SELECT COUNT(*) INTO total_staff FROM staff;
    SELECT COUNT(*) INTO total_daycare FROM daycare_children;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DATA DELETION STARTED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Records to be deleted:';
    RAISE NOTICE '  Users: %', total_users;
    RAISE NOTICE '  Organizations: %', total_orgs;
    RAISE NOTICE '  Leads: %', total_leads;
    RAISE NOTICE '  Students: %', total_students;
    RAISE NOTICE '  Staff: %', total_staff;
    RAISE NOTICE '  Daycare Children: %', total_daycare;
    RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- Delete data in correct order (respecting foreign keys)
-- =====================================================

DO $$
BEGIN
    -- 1. Delete child tables first (those with foreign keys to other tables)
    RAISE NOTICE 'Deleting AI-related data...';
    DELETE FROM ai_messages;
    DELETE FROM ai_interventions;  -- Delete before ai_predictions due to FK
    DELETE FROM ai_predictions;
    DELETE FROM ai_conversations;
    DELETE FROM ai_model_performance;
    DELETE FROM ai_analytics;

    RAISE NOTICE 'Deleting academic and engagement data...';
    DELETE FROM academic_records;
    DELETE FROM student_engagement;
    DELETE FROM course_pricing;
    DELETE FROM courses;

    RAISE NOTICE 'Deleting daycare data...';
    DELETE FROM daycare_payments;
    DELETE FROM daycare_attendance;
    DELETE FROM daycare_enrollments;
    DELETE FROM daycare_inquiry_followups;
    DELETE FROM daycare_inquiries;
    DELETE FROM daycare_billing_config;
    DELETE FROM daycare_children;

    RAISE NOTICE 'Deleting communication logs...';
    DELETE FROM communication_logs;

    RAISE NOTICE 'Deleting notifications...';
    DELETE FROM notifications;

    RAISE NOTICE 'Deleting fee and payment data...';
    DELETE FROM emi_schedule;
    DELETE FROM emi_plans;
    DELETE FROM e_mandates;
    DELETE FROM fee_payments;
    DELETE FROM fee_structure;
    DELETE FROM global_class_fees;

    RAISE NOTICE 'Deleting student data...';
    DELETE FROM students;

    RAISE NOTICE 'Deleting staff data...';
    DELETE FROM payroll;
    DELETE FROM attendance;
    DELETE FROM staff;

    RAISE NOTICE 'Deleting expense data...';
    DELETE FROM expenses;

    RAISE NOTICE 'Deleting lead data...';
    DELETE FROM follow_ups;
    DELETE FROM leads;
    DELETE FROM lead_sources;

    RAISE NOTICE 'Deleting message templates...';
    DELETE FROM message_templates;

    RAISE NOTICE 'Deleting recently deleted records...';
    DELETE FROM recently_deleted_leads;
    DELETE FROM recently_deleted_employee;

    -- 2. Delete parent tables (users and organizations)
    RAISE NOTICE 'Deleting users...';
    DELETE FROM users;

    RAISE NOTICE 'Deleting organizations...';
    DELETE FROM organizations;
END $$;

-- =====================================================
-- Verification
-- =====================================================
DO $$
DECLARE
    total_users INTEGER;
    total_orgs INTEGER;
    total_leads INTEGER;
    total_students INTEGER;
    total_staff INTEGER;
    total_daycare INTEGER;
    total_notifications INTEGER;
    total_payments INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM users;
    SELECT COUNT(*) INTO total_orgs FROM organizations;
    SELECT COUNT(*) INTO total_leads FROM leads;
    SELECT COUNT(*) INTO total_students FROM students;
    SELECT COUNT(*) INTO total_staff FROM staff;
    SELECT COUNT(*) INTO total_daycare FROM daycare_children;
    SELECT COUNT(*) INTO total_notifications FROM notifications;
    SELECT COUNT(*) INTO total_payments FROM fee_payments;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DATA DELETION COMPLETED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Remaining records (should all be 0):';
    RAISE NOTICE '  Users: %', total_users;
    RAISE NOTICE '  Organizations: %', total_orgs;
    RAISE NOTICE '  Leads: %', total_leads;
    RAISE NOTICE '  Students: %', total_students;
    RAISE NOTICE '  Staff: %', total_staff;
    RAISE NOTICE '  Daycare Children: %', total_daycare;
    RAISE NOTICE '  Notifications: %', total_notifications;
    RAISE NOTICE '  Fee Payments: %', total_payments;
    RAISE NOTICE '========================================';
    
    IF total_users = 0 AND total_orgs = 0 AND total_leads = 0 AND 
       total_students = 0 AND total_staff = 0 AND total_daycare = 0 THEN
        RAISE NOTICE 'SUCCESS: All data has been deleted!';
        RAISE NOTICE 'Database schema remains intact.';
    ELSE
        RAISE EXCEPTION 'ERROR: Some data was not deleted. Rolling back transaction.';
    END IF;
END $$;

-- Uncomment the line below to commit the changes
COMMIT;

-- Keep this commented by default for safety
-- ROLLBACK;

-- =====================================================
-- INSTRUCTIONS:
-- =====================================================
-- 1. Review the script carefully
-- 2. To execute: Comment out ROLLBACK and uncomment COMMIT
-- 3. Run the script in your database client
-- 4. Verify all tables are empty
-- =====================================================
