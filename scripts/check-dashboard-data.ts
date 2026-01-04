import { db } from "../server/db";
import { eq, sql } from "drizzle-orm";
import * as schema from "../shared/schema";

async function checkDashboardData() {
    console.log("=== Dashboard Data Debug ===\n");

    // Check all fee payments
    const allPayments = await db.select().from(schema.feePayments);
    console.log(`Total Fee Payments in DB: ${allPayments.length}`);

    if (allPayments.length > 0) {
        console.log("\nPayments:");
        allPayments.forEach(payment => {
            console.log(`  - ID: ${payment.id}, Amount: ₹${payment.amount}, Date: ${payment.paymentDate}, Org ID: ${payment.organizationId}`);
        });

        // Calculate total
        const total = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        console.log(`\nTotal Amount: ₹${total}`);
    }

    // Check totalRevenue calc
    const totalCollectedResult = await db
        .select({ total: sql<number>`cast(coalesce(sum(${schema.feePayments.amount}), 0) as integer)` })
        .from(schema.feePayments);

    console.log(`\nQuery Result for totalRevenue: ₹${totalCollectedResult[0]?.total || 0}`);

    // Check with organization filter
    const orgIds = [...new Set(allPayments.map(p => p.organizationId))];
    console.log(`\nOrganizations found in payments: ${orgIds.join(", ")}`);

    for (const orgId of orgIds) {
        if (orgId) {
            const orgTotal = await db
                .select({ total: sql<number>`cast(coalesce(sum(${schema.feePayments.amount}), 0) as integer)` })
                .from(schema.feePayments)
                .where(eq(schema.feePayments.organizationId, orgId));

            console.log(`  Org ${orgId}: ₹${orgTotal[0]?.total || 0}`);
        }
    }

    // Check enrolled students
    const enrolledStudents = await db
        .select({
            id: schema.leads.id,
            name: schema.leads.name,
            organizationId: schema.leads.organizationId
        })
        .from(schema.leads)
        .where(eq(schema.leads.status, 'enrolled'));

    console.log(`\nEnrolled Students: ${enrolledStudents.length}`);
    enrolledStudents.forEach(s => {
        console.log(`  - ${s.name} (ID: ${s.id}, Org: ${s.organizationId})`);
    });
}

checkDashboardData()
    .then(() => {
        console.log("\n=== Check Complete ===");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });
