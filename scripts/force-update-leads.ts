import { db } from '../server/db';
import { leads } from '../shared/schema';
import { sql } from 'drizzle-orm';

async function forceUpdateLeads() {
    console.log('🔄 STARTING BULK UPDATE: Setting Org ID = 1 and Status = "new" for ALL leads...');
    console.log('--------------------------------------------------------------------------------');

    try {
        // Perform update on all records
        const result = await db.update(leads)
            .set({
                organizationId: 1,
                status: 'new',
                updatedAt: new Date()
            })
            .returning({ id: leads.id });

        console.log(`✅ Successfully updated ${result.length} leads.`);
        console.log('   - Organization ID set to 1');
        console.log('   - Status set to "new"');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error updating leads:', error);
        process.exit(1);
    }
}

forceUpdateLeads();
