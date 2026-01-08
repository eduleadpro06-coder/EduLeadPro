
import { db } from "../server/db";
import { studentBusAssignments } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Checking student_bus_assignments table...");
    try {
        // 1. Try to select all
        console.log("Attempting to select all assignments...");
        const all = await db.select().from(studentBusAssignments);
        console.log("Success! Found " + all.length + " assignments.");
        console.log(all);

        // 2. Try to get assignments for a dummy routeId
        console.log("Attempting to select assignments for routeId=1...");
        const filtered = await db.select().from(studentBusAssignments).where(eq(studentBusAssignments.routeId, 1));
        console.log("Success! Found " + filtered.length + " assignments for route 1.");

        process.exit(0);
    } catch (error) {
        console.error("Error checking assignments:", error);
        process.exit(1);
    }
}

main();
