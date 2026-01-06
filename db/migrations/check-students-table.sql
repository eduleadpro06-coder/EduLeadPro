-- Check if students table exists and verify its structure
-- Run this FIRST to diagnose the issue

SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'students'
ORDER BY ordinal_position;

-- If the above returns no results, the students table doesn't exist
-- In that case, we need to create it first before running the preschool schema

-- Check what tables currently exist
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
