
import { db } from "../server/db";
import { leads, users, organizations } from "../shared/schema";
import { eq, ilike } from "drizzle-orm";

async function checkLead() {
    console.log("Checking for lead 'Aarya M. Rewakar'...");
    const foundLeads = await db.select().from(leads).where(ilike(leads.name, "%Aarya M. Rewakar%"));

    if (foundLeads.length === 0) {
        console.log("No lead found with that name.");
    } else {
        for (const lead of foundLeads) {
            console.log("Lead found:", {
                id: lead.id,
                name: lead.name,
                status: `'${lead.status}'`, // Wrapped in quotes
                organizationId: lead.organizationId
            });
        }
    }

    console.log("\nFetching leads by status 'enrolled' directly from DB...");
    const enrolledLeads = await db.select().from(leads).where(eq(leads.status, 'enrolled'));
    console.log(`Found ${enrolledLeads.length} enrolled leads directly.`);

    if (enrolledLeads.length > 0) {
        console.log("Sample enrolled lead org ID:", enrolledLeads[0].organizationId);
        const target = enrolledLeads.find(l => l.name.includes("Aarya"));
        if (target) {
            console.log("Aarya IS in the 'enrolled' list from DB.");
        } else {
            console.log("Aarya is NOT in the 'enrolled' list from DB.");
        }
    }

    process.exit(0);
}

checkLead().catch(console.error);
