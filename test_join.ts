import { storage } from "./server/storage.js";

async function testStorage() {
    try {
        const leads = await storage.getAllLeads();
        const assignedLead = leads.find(l => l.counselorId !== null);
        if (assignedLead) {
            console.log("=== ASSIGNED LEAD ===");
            console.log(JSON.stringify(assignedLead, null, 2));
        } else {
            console.log("No assigned leads found. Assigning lead 14 to counselor 4...");
            await storage.updateLead(14, { counselorId: 4 });
            const updatedLead = await storage.getLead(14);
            console.log("=== UPDATED LEAD ===");
            console.log(JSON.stringify(updatedLead, null, 2));
        }
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

testStorage();
