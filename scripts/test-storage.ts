
import { storage } from "../server/storage";

async function testStorage() {
    console.log("Testing storage.getLeadsByStatus('enrolled')...");
    try {
        const leads = await storage.getLeadsByStatus("enrolled");
        console.log(`Found ${leads.length} leads.`);

        if (leads.length > 0) {
            console.log("First lead:", {
                id: leads[0].id,
                name: leads[0].name,
                organizationId: leads[0].organizationId,
                counselor: leads[0].counselor
            });
        }
    } catch (err) {
        console.error("Error calling storage:", err);
    }

    process.exit(0);
}

testStorage().catch(console.error);
