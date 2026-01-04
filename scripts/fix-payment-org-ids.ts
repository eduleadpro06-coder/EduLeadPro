import { db } from "../server/db";
import { eq, isNull } from "drizzle-orm";
import * as schema from "../shared/schema";

async function fixPaymentOrganizationIds() {
    console.log("=== Fixing Fee Payment Organization IDs ===\n");

    // Get all payments with null organizationId
    const paymentsWithNullOrg = await db
        .select()
        .from(schema.feePayments)
        .where(isNull(schema.feePayments.organizationId));

    console.log(`Found ${paymentsWithNullOrg.length} payments with null organizationId`);

    for (const payment of paymentsWithNullOrg) {
        // Get the lead/student's organization
        const lead = await db
            .select({ organizationId: schema.leads.organizationId })
            .from(schema.leads)
            .where(eq(schema.leads.id, payment.leadId))
            .limit(1);

        if (lead.length > 0 && lead[0].organizationId) {
            const orgId = lead[0].organizationId;
            console.log(`Updating payment ID ${payment.id} (leadId: ${payment.leadId}) to org ${orgId}`);

            await db
                .update(schema.feePayments)
                .set({ organizationId: orgId })
                .where(eq(schema.feePayments.id, payment.id));

            console.log(`✓ Updated payment ID ${payment.id}`);
        } else {
            console.log(`✗ Could not find organization for payment ID ${payment.id} (leadId: ${payment.leadId})`);
        }
    }

    console.log("\n=== Fix Complete ===");
}

fixPaymentOrganizationIds()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });
