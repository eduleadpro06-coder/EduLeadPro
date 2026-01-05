import { db } from "../server/db";
import { leads, feePayments, feeStructure, emiPlans, emiSchedule } from "../shared/schema";
import { eq } from "drizzle-orm";

async function checkCurrentState() {
    console.log("=== CURRENT DASHBOARD DATA STATE ===\n");

    // Check enrolled students
    const enrolledStudents = await db.select().from(leads).where(eq(leads.status, 'enrolled'));
    console.log(`Enrolled Students: ${enrolledStudents.length}\n`);

    for (const student of enrolledStudents) {
        console.log(`📚 Student ID ${student.id}: ${student.studentName}`);
        console.log(`   Class: ${student.class}, Stream: ${student.stream || 'N/A'}`);

        // Get payments for this student
        const payments = await db.select().from(feePayments).where(eq(feePayments.studentId, student.id));
        const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        console.log(`   💰 Total Paid: ₹${totalPaid.toLocaleString()}`);

        if (payments.length > 0) {
            payments.forEach(p => {
                console.log(`      - ₹${p.amount} (${p.paymentCategory}) on ${p.paymentDate}`);
            });
        }

        // Check if EMI plan exists
        const emiPlan = await db.select().from(emiPlans).where(eq(emiPlans.studentId, student.id));
        if (emiPlan.length > 0) {
            console.log(`   📋 EMI Plan: ₹${emiPlan[0].totalAmount.toLocaleString()} total`);
            console.log(`      Down Payment: ₹${emiPlan[0].downPayment}`);
            console.log(`      Installments: ${emiPlan[0].numberOfInstallments}`);

            // Get pending installments
            const pendingInstallments = await db.select().from(emiSchedule)
                .where(eq(emiSchedule.studentId, student.id));
            const pending = pendingInstallments
                .filter(i => i.status !== 'paid')
                .reduce((sum, i) => sum + Number(i.amount), 0);
            console.log(`      Pending EMIs: ₹${pending.toLocaleString()}`);
        } else {
            console.log(`   ⚠️  No EMI Plan`);
        }
        console.log(``);
    }

    // Overall totals
    const allPayments = await db.select().from(feePayments);
    const totalCollected = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    const allEmiPlans = await db.select().from(emiPlans);
    const totalExpected = allEmiPlans.reduce((sum, p) => sum + Number(p.totalAmount), 0);

    const allFeeStructures = await db.select().from(feeStructure);

    console.log("=== DASHBOARD CALCULATIONS ===");
    console.log(`Total Collected (All Payments): ₹${totalCollected.toLocaleString()}`);
    console.log(`Total Expected (From EMI Plans): ₹${totalExpected.toLocaleString()}`);
    console.log(`Pending (Expected - Collected): ₹${(totalExpected - totalCollected).toLocaleString()}`);
    console.log(`Fee Structures Configured: ${allFeeStructures.length}`);

    console.log("\n=== EXPECTED DASHBOARD VALUES ===");
    console.log(`Total Revenue: ₹${totalCollected.toLocaleString()}`);
    console.log(`Fee Collected: ₹${totalCollected.toLocaleString()}`);
    console.log(`Pending Fees: ₹${Math.max(0, totalExpected - totalCollected).toLocaleString()}`);
    console.log(`Total Receivables: ₹${totalExpected > 0 ? totalExpected.toLocaleString() : totalCollected.toLocaleString()}`);

    process.exit(0);
}

checkCurrentState().catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
