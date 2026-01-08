
import { db } from "../server/db";
import { storage } from "../server/storage";
import { leads } from "../shared/schema";
import { eq, ilike } from "drizzle-orm";

async function main() {
    console.log("Testing Mobile Bus API logic...");
    try {
        // 1. Find Test Student ID
        const student = await db.query.leads.findFirst({
            where: ilike(leads.name, "%Test Student%")
        });

        if (!student) {
            console.error("Test Student not found!");
            process.exit(1);
        }
        console.log(`Found Student: ${student.name} (ID: ${student.id})`);

        // 2. Call the new storage method
        const assignment = await storage.getStudentBusAssignment(student.id);

        if (assignment) {
            console.log("Assignment found:", JSON.stringify(assignment, null, 2));
        } else {
            console.log("No assignment found for this student.");
        }

        process.exit(0);
    } catch (error) {
        console.error("Error testing bus API:", error);
        process.exit(1);
    }
}

main();
