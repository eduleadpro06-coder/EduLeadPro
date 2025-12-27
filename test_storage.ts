import { storage } from "./server/storage.js";

async function testStorage() {
    try {
        const counselors = await storage.getAllCounselors();
        console.log("=== STORAGE COUNSELORS ===");
        console.log(JSON.stringify(counselors, null, 2));

        const leads = await storage.getAllLeads();
        console.log("=== STORAGE LEADS (FIRST 1) ===");
        if (leads.length > 0) {
            console.log(JSON.stringify(leads[0], null, 2));
        } else {
            console.log("No leads found.");
        }
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

testStorage();
