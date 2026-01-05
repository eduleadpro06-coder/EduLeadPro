import { db } from "../server/db";
import { globalClassFees } from "../shared/schema";

async function checkGlobalFees() {
    const allFees = await db.select().from(globalClassFees);

    console.log(`Total Global Class Fees: ${allFees.length}\n`);

    allFees.forEach(fee => {
        console.log(`Class: ${fee.className}`);
        console.log(`  Fee Type: ${fee.feeType}`);
        console.log(`  Amount: ₹${Number(fee.amount).toLocaleString()}`);
        console.log(`  Frequency: ${fee.frequency}`);
        console.log(`  Academic Year: ${fee.academicYear}`);
        console.log(`  Active: ${fee.isActive}`);
        console.log(``);
    });

    process.exit(0);
}

checkGlobalFees().catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
