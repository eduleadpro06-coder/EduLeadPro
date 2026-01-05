import { db } from "../server/db";
import { leads, feePayments, emiPlans, globalClassFees } from "../shared/schema";
import { eq, and } from "drizzle-orm";

async function testCalculation() {
    console.log("=== SIMULATING DASHBOARD CALCULATION ===\n");

    const enrolledStudents = await db.select().from(leads).where(eq(leads.status, 'enrolled'));
    console.log(`Enrolled Students: ${enrolledStudents.length}\n`);

    const allEmiPlans = await db.select().from(emiPlans);
    const allGlobalClassFees = await db.select().from(globalClassFees)
        .where(eq(globalClassFees.isActive, true));

    const emiPlanMap = new Map();
    allEmiPlans.forEach(plan => {
        emiPlanMap.set(plan.studentId, Number(plan.totalAmount));
    });

    const globalFeeMap = new Map();
    allGlobalClassFees.forEach(gcf => {
        const existing = globalFeeMap.get(gcf.className) || 0;
        globalFeeMap.set(gcf.className, existing + Number(gcf.amount));
    });

    let totalExpected = 0;

    console.log("Calculating for each student:\n");
    for (const student of enrolledStudents) {
        console.log(`Student ${student.id} (${student.class}):`);

        if (emiPlanMap.has(student.id)) {
            const amount = emiPlanMap.get(student.id);
            console.log(`  ✅ Has EMI plan: ₹${amount.toLocaleString()}`);
            totalExpected += amount;
        } else if (globalFeeMap.has(student.class)) {
            const amount = globalFeeMap.get(student.class);
            console.log(`  ✅ Has Global Class Fee: ₹${amount.toLocaleString()}`);
            totalExpected += amount;
        } else {
            console.log(`  ❌ No fees configured`);
        }
        console.log(``);
    }

    const allPayments = await db.select().from(feePayments);
    const totalCollected = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    console.log("=== FINAL CALCULATION ===");
    console.log(`Total Expected: ₹${totalExpected.toLocaleString()}`);
    console.log(`Total Collected: ₹${totalCollected.toLocaleString()}`);
    console.log(`Pending: ₹${(totalExpected - totalCollected).toLocaleString()}`);
    console.log(``);
    console.log(`This should match: ₹58,500 expected, ₹5,000 collected, ₹53,500 pending`);

    process.exit(0);
}

testCalculation().catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
