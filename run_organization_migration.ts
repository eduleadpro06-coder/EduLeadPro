import pkg from 'pg';
const { Client } = pkg;
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Load environment variables
dotenv.config();

async function runMigration() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false // Bypass SSL certificate validation
        }
    });

    try {
        console.log("🔗 Connecting to database...");
        await client.connect();
        console.log("✅ Connected successfully\n");

        console.log("🚀 Starting organization migration...\n");

        // Step 1: Create organizations table
        console.log("Step 1: Creating organizations table...");
        await client.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        settings JSONB,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
        console.log("✅ Organizations table created\n");

        // Step 2: Create index
        console.log("Step 2: Creating case-insensitive name index...");
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_organizations_name_lower 
      ON organizations (LOWER(name))
    `);
        console.log("✅ Index created\n");

        // Step 3: Insert default organization
        console.log("Step 3: Creating default organization...");
        await client.query(`
      INSERT INTO organizations (name, slug, settings, is_active, created_at, updated_at)
      VALUES ('Default Organization', 'default-organization', '{}', true, NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING
    `);
        console.log("✅ Default organization created\n");

        // Step 4: Check existing tables and add organization_id
        console.log("Step 4: Adding organization_id columns...");
        const tables = [
            'users', 'leads', 'staff', 'students', 'expenses',
            'global_class_fees', 'message_templates',
            'daycare_children', 'daycare_inquiries',
            'daycare_billing_config', 'daycare_enrollments'
        ];

        for (const table of tables) {
            try {
                const checkTable = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `, [table]);

                if (checkTable.rows[0].exists) {
                    await client.query(`
            ALTER TABLE ${table} 
            ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id)
          `);
                    console.log(`   ✅ Added organization_id to ${table}`);
                } else {
                    console.log(`   ⚠️  Table ${table} doesn't exist, skipping`);
                }
            } catch (error) {
                console.log(`   ⚠️  Error with ${table}: ${error.message}`);
            }
        }
        console.log("");

        // Step 5: Update existing records
        console.log("Step 5: Assigning existing data to default organization...");
        for (const table of tables) {
            try {
                const result = await client.query(`
          UPDATE ${table} 
          SET organization_id = 1 
          WHERE organization_id IS NULL
        `);
                if (result.rowCount > 0) {
                    console.log(`   ✅ Updated ${result.rowCount} records in ${table}`);
                }
            } catch (error) {
                // Skip tables that don't exist or don't have the column
            }
        }
        console.log("");

        // Step 6: Create indexes
        console.log("Step 6: Creating performance indexes...");
        for (const table of tables) {
            try {
                await client.query(`
          CREATE INDEX IF NOT EXISTS idx_${table}_organization_id 
          ON ${table}(organization_id)
        `);
                console.log(`   ✅ Created index on ${table}`);
            } catch (error) {
                // Skip if table doesn't exist
            }
        }
        console.log("");

        // Step 7: Create helper function
        console.log("Step 7: Creating helper function...");
        await client.query(`
      CREATE OR REPLACE FUNCTION get_or_create_organization(org_name VARCHAR)
      RETURNS INTEGER AS $$
      DECLARE
        org_id INTEGER;
        org_slug VARCHAR;
      BEGIN
        SELECT id INTO org_id 
        FROM organizations 
        WHERE LOWER(name) = LOWER(org_name)
        LIMIT 1;
        
        IF org_id IS NULL THEN
          org_slug := LOWER(REGEXP_REPLACE(org_name, '[^a-zA-Z0-9]+', '-', 'g'));
          org_slug := TRIM(BOTH '-' FROM org_slug);
          
          WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = org_slug) LOOP
            org_slug := org_slug || '-' || FLOOR(RANDOM() * 1000)::TEXT;
          END LOOP;
          
          INSERT INTO organizations (name, slug, settings, is_active, created_at, updated_at)
          VALUES (org_name, org_slug, '{}', true, NOW(), NOW())
          RETURNING id INTO org_id;
        END IF;
        
        RETURN org_id;
      END;
      $$ LANGUAGE plpgsql
    `);
        console.log("✅ Helper function created\n");

        // Verification
        console.log("🔍 Verifying migration...");
        const orgResult = await client.query('SELECT COUNT(*) as count FROM organizations');
        console.log(`   Organizations in database: ${orgResult.rows[0].count}`);

        const usersResult = await client.query('SELECT COUNT(*) as count FROM users WHERE organization_id IS NOT NULL');
        console.log(`   Users with organization: ${usersResult.rows[0].count}`);

        try {
            const leadsResult = await client.query('SELECT COUNT(*) as count FROM leads WHERE organization_id IS NOT NULL');
            console.log(`   Leads with organization: ${leadsResult.rows[0].count}`);
        } catch (e) {
            console.log("   Leads table not verified (may not exist yet)");
        }

        console.log("\n✅ Migration completed successfully!");
        console.log("\n🎉 Your database is now multi-tenant ready!");

    } catch (error) {
        console.error("\n❌ Migration failed:", error);
        process.exit(1);
    } finally {
        await client.end();
        console.log("\n🔌 Database connection closed");
    }
}

runMigration();
