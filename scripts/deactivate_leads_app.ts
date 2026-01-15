
import 'dotenv/config';
import { db } from '../server/db';
import { leads } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function deactivateAppAccess() {
    console.log('🚀 Deactivating app access for ALL leads...');

    try {
        const result = await db.update(leads)
            .set({ isAppActive: false })
            .returning();

        console.log(`✅ Successfully updated ${result.length} leads.`);

    } catch (err) {
        console.error('❌ Error updating leads:', err);
    }
    process.exit(0);
}

deactivateAppAccess();
