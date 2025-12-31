import { db } from './server/db.js';
import { staff, globalClassFees } from './shared/schema.js';
import { eq, isNull } from 'drizzle-orm';

async function verifyOrgIdFixes() {
    console.log('\n=== VERIFICATION: Organization ID Injection Fixes ===\n');

    try {
        // Check for any staff with null organization_id
        const staffWithNullOrg = await db.select()
            .from(staff)
            .where(isNull(staff.organizationId));

        console.log(`Staff with null organization_id: ${staffWithNullOrg.length}`);
        if (staffWithNullOrg.length > 0) {
            console.log('Sample records:', staffWithNullOrg.slice(0, 3));
        }

        // Check for any global fees with null organization_id
        const feesWithNullOrg = await db.select()
            .from(globalClassFees)
            .where(isNull(globalClassFees.organizationId));

        console.log(`Global fees with null organization_id: ${feesWithNullOrg.length}`);
        if (feesWithNullOrg.length > 0) {
            console.log('Sample records:', feesWithNullOrg.slice(0, 3));
        }

        // Get the most recent staff member (to verify new ones are being created correctly)
        const recentStaff = await db.select()
            .from(staff)
            .orderBy(staff.createdAt)
            .limit(5);

        console.log('\n=== Most recent staff (last 5) ===');
        recentStaff.forEach(s => {
            console.log(`- ${s.name} (ID: ${s.id}, Org ID: ${s.organizationId})`);
        });

        // Get the most recent global fees
        const recentFees = await db.select()
            .from(globalClassFees)
            .orderBy(globalClassFees.createdAt)
            .limit(5);

        console.log('\n=== Most recent global fees (last 5) ===');
        recentFees.forEach(f => {
            console.log(`- ${f.className} - ${f.feeType} (ID: ${f.id}, Org ID: ${f.organizationId})`);
        });

        console.log('\n=== Verification Complete ===\n');

        if (staffWithNullOrg.length === 0 && feesWithNullOrg.length === 0) {
            console.log('✅ SUCCESS: No entries found with null organization_id!');
        } else {
            console.log('⚠️  WARNING: Some entries still have null organization_id.');
            console.log('These may be old entries created before the fix.');
            console.log('New entries created through the UI should have organization_id populated.');
        }

    } catch (error) {
        console.error('Error during verification:', error);
    } finally {
        process.exit(0);
    }
}

verifyOrgIdFixes();
