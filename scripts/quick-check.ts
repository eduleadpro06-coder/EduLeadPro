import { db } from "../server/db";
import { leads, feePayments, emiPlans } from "../shared/schema";
import { eq } from "drizzle-orm";

async function quickCheck() {
    console.log("=== QUICK STATE CHECK ===\n");

    const enrolledStudents = await db.select().from(leads).where(eq(leads.status, 'enrolled'));
    console.log(`Enrolled Students: ${enrolledStudents.length}`);

    for (const student of enrolledStudents) {
        console.log(`\nStudent ${student.id}: ${student.studentName || 'N/A'}`);
        console.log(`  Class: ${student.class}`);
    }

    const allPayments = await db.select().from(feePayments);
    const totalCollected = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    console.log(`\nTotal Payments Collected: ₹${totalCollected.toLocaleString()}`);
    console.log(`Number of Payments: ${allPayments.length}`);

    const allEmiPlans = await db.select().from(emiPlans);
    console.log(`\nEMI Plans: ${allEmiPlans.length}`);

    let totalExpected = 0;
    for (const plan of allEmiPlans) {
        const amount = Number(plan.totalAmount);
        totalExpected += amount;
        console.log(`  Student ${plan.studentId}: ₹${amount.toLocaleString()}`);
    }

    console.log(`\nTotal Expected (from EMI): ₹${totalExpected.toLocaleString()}`);
    console.log(`Total Collected: ₹${totalCollected.toLocaleString()}`);
    console.log(`Pending: ₹${(totalExpected - totalCollected).toLocaleString()}`);

    console.log("\n=== WHAT DASHBOARD SHOULD SHOW ===");
    console.log(`Total Revenue: ₹${totalCollected.toLocaleString()} (my fix uses collected)`);
    console.log(`Fee Collected: ₹${totalCollected.toLocaleString()}`);
    console.log(`Pending Fees: ₹${(totalExpected - totalCollected).toLocaleString()}`);
    console.log(`Total Receivables: ₹${totalExpected.toLocaleString()}`);

    process.exit(0);
}

quickCheck().catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
