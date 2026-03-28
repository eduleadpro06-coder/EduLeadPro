/**
 * Cleanup Script: Remove duplicate Follow-up Due notifications
 * 
 * Keeps only the FIRST notification per unique (type, actionId) combo.
 * Deletes all subsequent duplicates.
 * 
 * Run: npx tsx scripts/fix_duplicate_notifications.ts
 */
import { db } from "../server/db.js";
import { notifications } from "../shared/schema.js";
import { eq, and, inArray, sql } from "drizzle-orm";

async function main() {
    console.log("=== Duplicate Notification Cleanup ===\n");

    // Get all follow-up notifications
    const allNotifs = await db.select()
        .from(notifications)
        .where(eq(notifications.type, 'followup'));

    console.log(`Total follow-up notifications: ${allNotifs.length}`);

    // Group by actionId (or by title + message if actionId is missing)
    const seen = new Map<string, number>(); // key -> first notification id
    const duplicateIds: number[] = [];

    for (const notif of allNotifs) {
        // Use actionId as the dedup key, or fall back to message content
        const key = notif.actionId || `${notif.title}:${notif.message}`;
        
        if (seen.has(key)) {
            duplicateIds.push(notif.id);
        } else {
            seen.set(key, notif.id);
        }
    }

    console.log(`Unique follow-up notifications: ${seen.size}`);
    console.log(`Duplicate notifications to remove: ${duplicateIds.length}`);

    if (duplicateIds.length > 0) {
        // Delete in batches of 50
        for (let i = 0; i < duplicateIds.length; i += 50) {
            const batch = duplicateIds.slice(i, i + 50);
            await db.delete(notifications)
                .where(inArray(notifications.id, batch));
        }
        console.log(`\nDeleted ${duplicateIds.length} duplicate notifications.`);
    } else {
        console.log(`\nNo duplicates found.`);
    }

    // Also clean up any other notification types with duplicates
    const allOtherNotifs = await db.select()
        .from(notifications)
        .where(sql`${notifications.type} != 'followup'`);

    const otherSeen = new Map<string, number>();
    const otherDuplicateIds: number[] = [];

    for (const notif of allOtherNotifs) {
        if (!notif.actionId) continue; // skip if no actionId
        const key = `${notif.type}:${notif.actionId}`;
        if (otherSeen.has(key)) {
            otherDuplicateIds.push(notif.id);
        } else {
            otherSeen.set(key, notif.id);
        }
    }

    if (otherDuplicateIds.length > 0) {
        for (let i = 0; i < otherDuplicateIds.length; i += 50) {
            const batch = otherDuplicateIds.slice(i, i + 50);
            await db.delete(notifications)
                .where(inArray(notifications.id, batch));
        }
        console.log(`Deleted ${otherDuplicateIds.length} other duplicate notifications.`);
    }

    console.log("\nDone!");
    process.exit(0);
}

main().catch(err => {
    console.error("Cleanup failed:", err);
    process.exit(1);
});
