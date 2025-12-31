import { db } from './server/db.js';
import { leads } from './shared/schema.js';
import { isNull, count, eq } from 'drizzle-orm';

console.log('🔄 Updating all leads...\n');

try {
    // Count before update
    const [beforeTotal] = await db.select({ count: count() }).from(leads);
    const [beforeOrgNull] = await db.select({ count: count() })
        .from(leads)
        .where(isNull(leads.organizationId));

    console.log('📊 Before Update:');
    console.log(`  Total leads: ${beforeTotal.count}`);
    console.log(`  Leads without organization: ${beforeOrgNull.count}\n`);

    // Update all leads - set organization ID to 60 and status to 'new'
    await db
        .update(leads)
        .set({
            organizationId: 60,
            status: 'new'
        });

    console.log('✅ Update executed!\n');

    // Count after update
    const [afterTotal] = await db.select({ count: count() }).from(leads);
    const [afterOrg60] = await db.select({ count: count() })
        .from(leads)
        .where(eq(leads.organizationId, 60));
    const [afterNew] = await db.select({ count: count() })
        .from(leads)
        .where(eq(leads.status, 'new'));

    console.log('📊 After Update:');
    console.log(`  Total leads: ${afterTotal.count}`);
    console.log(`  Leads with organization ID 60: ${afterOrg60.count}`);
    console.log(`  Leads with status "new": ${afterNew.count}\n`);

    if (Number(afterOrg60.count) === Number(afterTotal.count) && Number(afterNew.count) === Number(afterTotal.count)) {
        console.log('✅ SUCCESS: All leads updated successfully!');
        console.log(`   - ${afterTotal.count} leads assigned to Organization ID: 60`);
        console.log(`   - ${afterNew.count} leads set to status: new`);
    } else {
        console.log('⚠️  WARNING: Not all leads were updated as expected');
        console.log(`   Expected: ${afterTotal.count}, Org 60: ${afterOrg60.count}, Status new: ${afterNew.count}`);
    }

    process.exit(0);
} catch (error) {
    console.error('❌ Error updating leads:', error.message);
    console.error(error);
    process.exit(1);
}
