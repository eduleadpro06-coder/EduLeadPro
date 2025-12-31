
import { storage } from "../server/storage";
import { db } from "../server/db";
import { feePayments, leads, feeStructure } from "../shared/schema";
import { eq, and } from "drizzle-orm";

async function checkData() {
    console.log("--- Dashboard Data Check ---");

    // Check enrolled students
    const enrolled = await db.select().from(leads).where(eq(leads.status, 'enrolled'));
    console.log(`Enrolled Students Count: ${enrolled.length}`);
    enrolled.forEach(s => {
        console.log(`- Student: ${s.name} (ID: ${s.id}), Org: ${s.organizationId}`);
    });

    // Check fee payments
    const payments = await db.select().from(feePayments);
    console.log(`Fee Payments Count: ${payments.length}`);
    payments.forEach(p => {
        console.log(`- Amount: ${p.amount}, Date: ${p.paymentDate}, Category: ${p.paymentCategory}, Org: ${p.organizationId}`);
    });

    // Test the analytics function
    const analytics = await storage.getDashboardAnalytics(1);
    console.log("\n--- Analytics Results (Org 1) ---");
    console.log(`Total Revenue (KPI - StudentFee): ${analytics.kpis.studentFee.value}`);
    console.log(`Revenue Change Badge: ${analytics.kpis.studentFee.change}%`);
    console.log(`Total Receivables (KPI): ${analytics.kpis.totalReceivables.value}`);

    console.log(`\nFee Analytics Breakdown:`);
    console.log(`Paid vs Pending:`, JSON.stringify(analytics.feeAnalytics.paidVsPending));

    // Check the monthly collection trend to see if Dec 31st is there
    console.log(`\nMonthly Collection Trend:`);
    analytics.feeAnalytics.monthlyCollection.forEach((m: any) => {
        console.log(`- ${m.month}: ${m.collected}`);
    });
}

checkData().catch(console.error);
