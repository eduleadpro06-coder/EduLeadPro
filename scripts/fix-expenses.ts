
import { db } from "../server/db";
import { expenses, organizations } from "../shared/schema";
import { eq, isNull } from "drizzle-orm";

async function main() {
    console.log("Fixing expense organization IDs...");

    // Get first organization
    const orgs = await db.select().from(organizations).limit(1);
    if (orgs.length === 0) {
        console.error("No organizations found! Cannot assign expenses.");
        process.exit(1);
    }
    const orgId = orgs[0].id;
    console.log(`Using Organization ID: ${orgId}`);

    // Update all expenses with null organizationId to this orgId
    const result = await db.update(expenses)
        .set({ organizationId: orgId })
        .where(isNull(expenses.organizationId))
        .returning();

    console.log(`Updated ${result.length} expenses to Organization ID ${orgId}`);
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
