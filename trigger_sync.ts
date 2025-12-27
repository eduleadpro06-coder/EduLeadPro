import { storage } from "./server/storage.js";

async function triggerSync() {
    try {
        console.log("Triggering counselor sync...");
        const counselors = await storage.getAllCounselors();
        console.log("Sync complete. Counselors found:", counselors.length);
        console.log(JSON.stringify(counselors, null, 2));
    } catch (err) {
        console.error("Sync failed:", err);
    }
    process.exit(0);
}

triggerSync();
