import { db } from "../server/db";
import { leads } from "../shared/schema";
import { eq } from "drizzle-orm";

async function checkStudent136Fields() {
    const student = await db.select().from(leads).where(eq(leads.id, 136));

    if (student.length > 0) {
        console.log("Student 136 - ALL FIELDS:");
        console.log(JSON.stringify(student[0], null, 2));
    } else {
        console.log("Student 136 not found!");
    }

    process.exit(0);
}

checkStudent136Fields().catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
