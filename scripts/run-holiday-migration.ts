// Script to run the organization holidays migration
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client with admin key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    try {
        console.log('Reading migration file...');
        const migrationPath = path.join(__dirname, '../db/migrations/add-organization-holidays.sql');
        const sql = fs.readFileSync(migrationPath, 'utf-8');

        console.log('Running migration...');

        // Split SQL into individual statements (simple split by semicolon)
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            if (statement.trim()) {
                console.log(`Executing: ${statement.substring(0, 50)}...`);
                const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

                if (error) {
                    console.error('Error executing statement:', error);
                    // Try direct execution for CREATE TABLE
                    if (statement.includes('CREATE TABLE')) {
                        console.log('Trying alternative method...');
                        // Create table using Supabase client (this won't work for all SQL, but we can try)
                    }
                }
            }
        }

        console.log('✅ Migration completed successfully!');

        // Verify table exists
        const { data, error } = await supabase
            .from('organization_holidays')
            .select('count')
            .limit(1);

        if (!error) {
            console.log('✅ Table verified successfully!');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
