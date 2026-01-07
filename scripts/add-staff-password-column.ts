import { sql } from 'drizzle-orm';
import { db } from '../server/db';

async function addStaffPasswordColumn() {
    try {
        console.log('Adding app_password column to staff table...');

        await db.execute(sql`
            ALTER TABLE staff 
            ADD COLUMN IF NOT EXISTS app_password VARCHAR(255)
        `);

        console.log('✅ Column added successfully!');
        console.log('Teachers can now set custom passwords.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

addStaffPasswordColumn();
