import { db } from "../server/db";
import { leads, feePayments, feeStructure, emiPlans } from "../shared/schema";

async function checkDashboardDataDetailed() {
    console.log("=== Detailed Dashboard Data Check ===\n");

    // 1. Check all leads (students)
    console.log("1. ALL LEADS/STUDENTS:");
    const allLeads = await db.select().from(leads);
    console.log(`Total leads: ${allLeads.length}\n`);

    const enrolledStudents = allLeads.filter((l) => l.status === 'enrolled');
    console.log(`Enrolled students: ${enrolledStudents.length}\n`);
    enrolledStudents.forEach((student) => {
        console.log(`  - ID: ${student.id}`);
        console.log(`    Name: ${student.studentName}`);
        console.log(`    Parent: ${student.parentName}`);
        console.log(`    Status: ${student.status}`);
        console.log(`    Class: ${student.class}`);
        console.log(`    Stream: ${student.stream || 'N/A'}`);
        console.log(`    Organization ID: ${student.organizationId}`);
        console.log(``);
    });

    // 2. Check fee payments
    console.log("2. FEE PAYMENTS:");
    const allPayments = await db.select().from(feePayments);
    console.log(`Total payments: ${allPayments.length}`);
    const totalCollected = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    console.log(`Total collected: ₹${totalCollected.toLocaleString()}\n`);
    allPayments.forEach((payment) => {
        console.log(`  - Payment ID: ${payment.id}`);
        console.log(`    Student ID: ${payment.studentId}`);
        console.log(`    Amount: ₹${payment.amount}`);
        console.log(`    Category: ${payment.paymentCategory}`);
        console.log(`    Date: ${payment.paymentDate}`);
        console.log(`    Org ID: ${payment.organizationId}`);
        console.log(``);
    });

    // 3. Check fee structures
    console.log("3. FEE STRUCTURES:");
    const allFeeStructures = await db.select().from(feeStructure);
    console.log(`Total fee structures: ${allFeeStructures.length}\n`);
    allFeeStructures.forEach((fs) => {
        console.log(`  - Class: ${fs.class}, Stream: ${fs.stream || 'N/A'}`);
        console.log(`    Total Fees: ₹${fs.totalFees}`);
        console.log(`    Org ID: ${fs.organizationId}`);
        console.log(``);
    });

    // 4. Check EMI plans
    console.log("4. EMI PLANS:");
    const allEmiPlans = await db.select().from(emiPlans);
    console.log(`Total EMI plans: ${allEmiPlans.length}\n`);
    allEmiPlans.forEach((plan) => {
        console.log(`  - Student ID: ${plan.studentId}`);
        console.log(`    Total Amount: ₹${plan.totalAmount}`);
        console.log(`    Down Payment: ₹${plan.downPayment}`);
        console.log(`    Installments: ${plan.numberOfInstallments}`);
        console.log(``);
    });

    // 5. Calculation check
    console.log("=== DASHBOARD CALCULATION CHECK ===\n");
    console.log(`Enrolled Students: ${enrolledStudents.length}`);
    console.log(`Fee Collected: ₹${totalCollected.toLocaleString()}`);

    // Calculate expected revenue based on logic from getDashboardAnalytics
    let expectedRevenue = 0;

    // Build a map for EMI plans
    const emiPlanMap = new Map();
    allEmiPlans.forEach((plan) => {
        emiPlanMap.set(plan.studentId, Number(plan.totalAmount));
    });

    // Build a map for fee structures
    const feeMap = new Map();
    allFeeStructures.forEach((fs) => {
        const key = `${fs.class}_${fs.stream}`;
        feeMap.set(key, Number(fs.totalFees));
    });

    console.log(`\nCalculating expected revenue for each enrolled student:`);
    enrolledStudents.forEach((student) => {
        if (emiPlanMap.has(student.id)) {
            const amount = emiPlanMap.get(student.id);
            console.log(
                `  - ${student.studentName} (ID ${student.id}): ₹${amount.toLocaleString()} (from EMI Plan)`
            );
            expectedRevenue += amount;
        } else {
            const key = `${student.class}_${student.stream}`;
            if (feeMap.has(key)) {
                const amount = feeMap.get(key);
                console.log(
                    `  - ${student.studentName} (ID ${student.id}): ₹${amount.toLocaleString()} (from Fee Structure for ${key})`
                );
                expectedRevenue += amount;
            } else {
                console.log(
                    `  - ${student.studentName} (ID ${student.id}): ₹0 (NO FEE STRUCTURE or EMI PLAN!)`
                );
            }
        }
    });

    console.log(`\nTotal Expected Revenue: ₹${expectedRevenue.toLocaleString()}`);
    console.log(`Total Collected: ₹${totalCollected.toLocaleString()}`);
    console.log(`Pending: ₹${Math.max(0, expectedRevenue - totalCollected).toLocaleString()}`);

    console.log("\n=== ROOT CAUSE ===");
    if (allFeeStructures.length === 0 && allEmiPlans.length === 0) {
        console.log("❌ NO FEE STRUCTURES OR EMI PLANS EXIST!");
        console.log("   Dashboard cannot calculate Total Receivables or Pending Fees.");
        console.log("   Solution: Add fee structures for each class OR create EMI plans for students.");
    } else if (allFeeStructures.length === 0) {
        console.log("⚠️  No fee structures exist, but EMI plans are present.");
    } else {
        console.log("✅ Fee structures exist.");
    }

    process.exit(0);
}

checkDashboardDataDetailed().catch((err) => {
    console.error("Error:", err);
    process.exit(1);
});
