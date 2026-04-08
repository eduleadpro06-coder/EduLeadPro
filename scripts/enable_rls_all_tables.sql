-- SQL script to enable Row Level Security (RLS) on all tables in the public schema.
-- This script does not define any policies, meaning it defaults to "deny all" 
-- for non-superuser roles (like anon and authenticated).
-- The Express backend uses a superuser connection and will not be affected.

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        RAISE NOTICE 'Enabling RLS on table: %', r.tablename;
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
    END LOOP;
END $$;
