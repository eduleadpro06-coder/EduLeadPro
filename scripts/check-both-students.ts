import { db } from "../server/db";
import { leads, feePayments, emiPlans } from "../shared/schema";
import { eq } from "drizzle-orm";

async function checkBothStudents() {
    console.log("=== CHECKING BOTH ENROLLED STUDENTS ===\n");

    const enrolled = await db.select().from(leads).where(eq(leads.status, 'enrolled'));

    for (const student of enrolled) {
        console.log(`\n━━━ Student ${student.id}: ${student.name} ━━━`);
        console.log(`Class: ${student.class}`);
        console.log(`Status: ${student.status}`);

        // EMI Plan
        const emiPlan = await db.select().from(emiPlans).where(eq(emiPlans.studentId, student.id));
        if (emiPlan.length > 0) {
            const plan = emiPlan[0];
            console.log(`\n✅ EMI Plan EXISTS:`);
            console.log(`   Total Amount: ₹${Number(plan.totalAmount).toLocaleString()}`);
            console.log(`   Installments: ${plan.numberOfInstallments}`);
            console.log(`   Installment Amount: ₹${Number(plan.installmentAmount).toLocaleString()}`);
            console.log(`   Down Payment: ₹${Number(plan.downPayment || 0).toLocaleString()}`);
        } else {
            console.log(`\n❌ NO EMI PLAN`);
        }

        // Payments
        const payments = await db.select().from(feePayments).where(eq(feePayments.leadId, student.id));
        const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        console.log(`\n💰 Payments:`);
        console.log(`   Total Paid: ₹${totalPaid.toLocaleString()}`);
        console.log(`   Number of Payments: ${payments.length}`);

        if (payments.length > 0) {
            payments.forEach((p, idx) => {
                console.log(`   ${idx + 1}. ₹${Number(p.amount).toLocaleString()} - ${p.paymentCategory} (${p.paymentDate})`);
            });
        }

        // Calculate pending
        if (emiPlan.length > 0) {
            const expected = Number(emiPlan[0].totalAmount);
            const pending = expected - totalPaid;
            console.log(`\n📊 Calculation:`);
            console.log(`   Expected (EMI Plan): ₹${expected.toLocaleString()}`);
            console.log(`   Paid: ₹${totalPaid.toLocaleString()}`);
            console.log(`   Pending: ₹${pending.toLocaleString()}`);
        } else {
            console.log(`\n⚠️  Cannot calculate pending - no EMI plan or fee structure`);
        }
    }

    console.log("\n\n=== SUMMARY FOR DASHBOARD ===");
    const allPayments = await db.select().from(feePayments);
    const allEmi = await db.select().from(emiPlans);

    const totalCollected = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalExpected = allEmi.reduce((sum, p) => sum + Number(p.totalAmount), 0);

    console.log(`Total Expected (from EMI plans): ₹${totalExpected.toLocaleString()}`);
    console.log(`Total Collected (all payments): ₹${totalCollected.toLocaleString()}`);
    console.log(`Total Pending: ₹${(totalExpected - totalCollected).toLocaleString()}`);

    process.exit(0);
}

checkBothStudents().catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
