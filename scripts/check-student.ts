import { db } from "../server/db";
import { leads, feePayments, emiPlans } from "../shared/schema";
import { eq } from "drizzle-orm";

async function checkStudent169() {
    // Get the student record
    const student = await db.select().from(leads).where(eq(leads.id, 169));

    if (student.length > 0) {
        console.log("Student 169 Data:");
        console.log(JSON.stringify(student[0], null, 2));
    }

    // Get EMI plan
    const emiPlan = await db.select().from(emiPlans).where(eq(emiPlans.studentId, 169));
    if (emiPlan.length > 0) {
        console.log("\nEMI Plan:");
        console.log(JSON.stringify(emiPlan[0], null, 2));
    }

    // Get payments
    const payments = await db.select().from(feePayments).where(eq(feePayments.leadId, 169));
    console.log(`\nPayments: ${payments.length}`);
    payments.forEach(p => {
        console.log(`  Amount: ₹${p.amount}, Category: ${p.paymentCategory}, Date: ${p.paymentDate}`);
    });

    process.exit(0);
}

checkStudent169().catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
