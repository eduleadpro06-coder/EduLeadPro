/**
 * Database Migration Runner
 * Run this script to apply the bus tracking schema to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Supabase credentials not found in environment variables');
    console.log('\nPlease ensure your .env file has:');
    console.log('  VITE_SUPABASE_URL=https://your-project.supabase.co');
    console.log('  SUPABASE_SERVICE_ROLE_KEY=your-service-key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('🚀 Starting database migration...\n');

    try {
        // Read the migration file
        const migrationPath = join(process.cwd(), 'db', 'migrations', 'add-bus-tracking-schema.sql');
        const sql = readFileSync(migrationPath, 'utf-8');

        console.log('📄 Migration file loaded');
        console.log(`📊 File size: ${sql.length} characters\n`);

        // Execute the migration
        console.log('⏳ Executing migration...');
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            // If RPC method doesn't exist, try alternative approach
            console.log('⚠️  RPC method not available, using alternative approach...\n');
            console.log('Please run the migration manually through Supabase Dashboard:');
            console.log('\n1. Go to https://app.supabase.com');
            console.log('2. Select your project');
            console.log('3. Click "SQL Editor" in the left sidebar');
            console.log('4. Click "New Query"');
            console.log('5. Copy the contents of: db/migrations/add-bus-tracking-schema.sql');
            console.log('6. Paste into the editor');
            console.log('7. Click "RUN"\n');
            console.log('Error details:', error.message);
            return;
        }

        console.log('✅ Migration completed successfully!\n');

        // Verify tables were created
        console.log('🔍 Verifying tables...');
        const { data: tables, error: tablesError } = await supabase
            .from('bus_routes')
            .select('count')
            .limit(1);

        if (tablesError) {
            console.log('⚠️  Could not verify tables:', tablesError.message);
        } else {
            console.log('✅ Tables verified - migration successful!\n');
        }

        console.log('🎉 Database is ready for bus tracking!');

    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);
        console.log('\n📖 Manual migration instructions:');
        console.log('1. Open Supabase Dashboard: https://app.supabase.com');
        console.log('2. Go to SQL Editor');
        console.log('3. Run the SQL from: db/migrations/add-bus-tracking-schema.sql\n');
    }
}

// Run the migration
runMigration().then(() => {
    console.log('\n✨ Migration process complete');
    process.exit(0);
}).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
