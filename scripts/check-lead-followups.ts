
import { db } from "../server/db";
import { leads, followUps } from "../shared/schema";
import { eq, ilike } from "drizzle-orm";

async function checkFollowUps() {
    console.log("Searching for lead 'Amit Singh'...");

    const foundLeads = await db.select().from(leads).where(ilike(leads.name, "%Amit Singh%"));

    if (foundLeads.length === 0) {
        console.log("No lead found with name 'Amit Singh'");
        process.exit(0);
    }

    for (const lead of foundLeads) {
        console.log(`\nFound Lead: ID ${lead.id}, Name: ${lead.name}, Phone: ${lead.phone}`);

        const leadFollowUps = await db.select().from(followUps).where(eq(followUps.leadId, lead.id));

        console.log(`Follow-ups count: ${leadFollowUps.length}`);
        if (leadFollowUps.length > 0) {
            console.log(JSON.stringify(leadFollowUps, null, 2));
        } else {
            console.log("No follow-ups found for this lead.");
        }
    }

    process.exit(0);
}

checkFollowUps().catch(err => {
    console.error(err);
    process.exit(1);
});
