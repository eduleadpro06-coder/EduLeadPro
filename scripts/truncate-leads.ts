import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function truncateLeads() {
    console.log('🗑️  STARTING TRUNCATE: Leads Table (Cascade) ...');
    console.log('----------------------------------------------------');
    console.log('⚠️  This will delete all leads, follow-ups, payments, etc.');
    console.log('   Users and Organizations will be PRESERVED.');

    try {
        await db.execute(sql.raw(`TRUNCATE TABLE leads RESTART IDENTITY CASCADE;`));

        console.log('✅ Leads table truncated successfully.');
        console.log('   You can now run the import script again.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error truncating leads:', error);
        process.exit(1);
    }
}

truncateLeads();
