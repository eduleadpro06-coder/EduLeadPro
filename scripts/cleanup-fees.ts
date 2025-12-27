
import { db } from "../server/db";
import { globalClassFees } from "../shared/schema";
import { sql, inArray } from "drizzle-orm";

async function cleanupFees() {
    console.log("Cleaning up extra seeded classes...");

    // Classes to remove (User said they only added Nursery, so remove the others I seeded)
    const classesToRemove = ["Playgroup", "Junior KG", "Senior KG"];

    const result = await db.delete(globalClassFees)
        .where(inArray(globalClassFees.className, classesToRemove))
        .returning();

    console.log(`Deleted ${result.length} fees:`);
    result.forEach(f => console.log(`- ${f.className}`));

    console.log("Cleanup complete!");
    process.exit(0);
}

cleanupFees().catch((err) => {
    console.error("Error cleaning up fees:", err);
    process.exit(1);
});
