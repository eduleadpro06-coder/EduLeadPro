
import { db } from "../server/db";
import { globalClassFees } from "../shared/schema";
import { sql } from "drizzle-orm";

async function seedClasses() {
    console.log("Seeding new classes...");

    const newClasses = ["Playgroup", "Nursery", "Junior KG", "Senior KG"];

    for (const className of newClasses) {
        // Check if class already exists
        const existing = await db.select().from(globalClassFees).where(sql`${globalClassFees.className} = ${className} AND ${globalClassFees.isActive} = true`);

        if (existing.length === 0) {
            console.log(`Adding ${className}...`);
            await db.insert(globalClassFees).values({
                className: className,
                feeType: "Tuition",
                amount: "50000",
                frequency: "Yearly",
                academicYear: "2024-2025",
                description: "Standard tuition fee",
                isActive: true
            });
        } else {
            console.log(`${className} already exists.`);
        }
    }

    console.log("Seeding complete!");
    process.exit(0);
}

seedClasses().catch((err) => {
    console.error("Error seeding classes:", err);
    process.exit(1);
});
