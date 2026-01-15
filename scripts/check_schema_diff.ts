/**
 * Schema Comparison Script
 * Compares database columns with schema.ts to find discrepancies
 */

import 'dotenv/config';
import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';

async function main() {
    console.log('🔍 SCHEMA DISCREPANCY CHECK\n');

    // Check for columns in DB that might be missing from schema
    const checkColumns = await db.execute(sql`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND column_name IN (
      'is_enrolled', 
      'profile_photo', 
      'section', 
      'batch'
    )
    ORDER BY table_name, column_name
  `);

    console.log('📋 Columns in DB (may be missing from schema.ts):');
    for (const row of checkColumns.rows as any[]) {
        console.log(`  - ${row.table_name}.${row.column_name} (${row.data_type})`);
    }

    // Check for organization_holidays table
    const checkTable = await db.execute(sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'organization_holidays'
  `);

    console.log('\n📋 Tables in DB (may be missing from schema.ts):');
    for (const row of checkTable.rows as any[]) {
        console.log(`  - ${row.table_name}`);
    }

    // Get organization_holidays structure if it exists
    if ((checkTable.rows as any[]).length > 0) {
        const holidaysCols = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'organization_holidays'
      ORDER BY ordinal_position
    `);

        console.log('\n📋 organization_holidays table structure:');
        for (const row of holidaysCols.rows as any[]) {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        }
    }

    console.log('\n✅ Check complete');
    process.exit(0);
}

main().catch(e => {
    console.error('Error:', e);
    process.exit(1);
});
