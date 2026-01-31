import { db } from "../server/db";
import * as schema from "../shared/schema";
import { eq } from "drizzle-orm";

async function updateReceiptNumbers() {
    console.log("Starting receipt number migration...");

    try {
        // Get all fee payments
        const allPayments = await db.select().from(schema.feePayments);
        console.log(`Found ${allPayments.length} total payments`);

        let updatedCount = 0;

        for (const payment of allPayments) {
            if (payment.organizationId) {
                // Get organization for dynamic prefix
                const organization = await db
                    .select()
                    .from(schema.organizations)
                    .where(eq(schema.organizations.id, payment.organizationId))
                    .limit(1);

                if (organization[0]) {
                    const org = organization[0];
                    const orgPrefix = org.name
                        ? org.name.substring(0, 3).toUpperCase()
                        : "ORG";

                    // Determine Academic Year: Use Settings > Configured, else Fallback to 2026-27 (matching client default)
                    const orgSettings = org.settings as any || {};
                    const configuredAcademicYear = orgSettings.academicYear;
                    const academicYear = configuredAcademicYear || "2026-27";

                    // Generate new receipt number
                    const newReceiptNumber = `${orgPrefix} / ${academicYear}/${String(payment.id).padStart(6, '0')}`;

                    // Check if update is needed (compare ignoring spaces and normalize)
                    const currentReceipt = payment.receiptNumber || "";
                    const normalize = (s: string) => s.replace(/\s/g, '');

                    if (normalize(currentReceipt) !== normalize(newReceiptNumber)) {
                        console.log(`Updating Payment ${payment.id}: ${currentReceipt} → ${newReceiptNumber}`);

                        await db
                            .update(schema.feePayments)
                            .set({ receiptNumber: newReceiptNumber })
                            .where(eq(schema.feePayments.id, payment.id));

                        updatedCount++;
                    }
                }
            }
        }

        console.log(`\n✅ Migration complete! Updated ${updatedCount} receipt numbers.`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

updateReceiptNumbers();
