import { db } from "./server/db";
import { staff, globalClassFees } from "./shared/schema";
import { isNull, eq, or } from "drizzle-orm";

async function checkData() {
    console.log("Checking staff table...");
    const staffEntries = await db.select().from(staff).where(or(isNull(staff.organizationId), eq(staff.organizationId, 60)));
    console.log(`Found ${staffEntries.length} entries for staff (null or organization 60)`);
    staffEntries.forEach(s => {
        console.log(`- ID: ${s.id}, Name: ${s.name}, OrganizationID: ${s.organizationId}`);
    });

    console.log("\nChecking global_class_fees table...");
    const feeEntries = await db.select().from(globalClassFees).where(or(isNull(globalClassFees.organizationId), eq(globalClassFees.organizationId, 60)));
    console.log(`Found ${feeEntries.length} entries for global_class_fees (null or organization 60)`);
    feeEntries.forEach(f => {
        console.log(`- ID: ${f.id}, Class: ${f.className}, Type: ${f.feeType}, OrganizationID: ${f.organizationId}`);
    });
}

checkData().catch(console.error);
