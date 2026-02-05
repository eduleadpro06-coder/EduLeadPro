import { db } from "../server/db.js";
import { leads } from "../shared/schema.js";
import { eq, and, or, isNull } from "drizzle-orm";

/**
 * Migration Script: Fix Meta/Make.com Imported Leads
 * 
 * This script fixes leads that were imported via Make.com integration
 * before the field mapping was corrected. It:
 * 1. Finds leads with source "Facebook Make" or "Meta Marketing"
 * 2. Maps the phone field to fatherPhone if fatherPhone is missing
 * 3. Attempts to parse the student name to extract father's name if missing
 */

async function migrateMetaLeadData() {
    console.log("Starting Meta lead data migration...\n");

    try {
        // Find all leads from Meta sources that are missing father data
        const metaLeads = await db
            .select()
            .from(leads)
            .where(
                and(
                    or(
                        eq(leads.source, "Facebook Make"),
                        eq(leads.source, "Meta Marketing")
                    ),
                    or(
                        isNull(leads.fatherPhone),
                        isNull(leads.fatherFirstName)
                    )
                )
            );

        console.log(`Found ${metaLeads.length} leads needing migration\n`);

        if (metaLeads.length === 0) {
            console.log("No leads to migrate. Exiting.");
            process.exit(0);
        }

        let updated = 0;
        let skipped = 0;

        for (const lead of metaLeads) {
            const updates: any = {};
            let hasUpdates = false;

            // 1. Map phone to fatherPhone if missing
            if (!lead.fatherPhone && lead.phone) {
                updates.fatherPhone = lead.phone;
                hasUpdates = true;
            }

            // 2. Try to extract father's name if missing
            // Note: This is a best-effort approach. We don't have the original parent name
            // for leads where it wasn't stored, so we'll just log them for manual review
            if (!lead.fatherFirstName && !lead.fatherLastName) {
                console.log(`⚠️  Lead ID ${lead.id} ("${lead.name}") - Father name missing. Manual review needed.`);
                // You could add logic here if you have access to Make.com webhook logs
                // or Meta's API to retrieve the original lead data
            }

            // 3. Update the source field if it's "Facebook Make"
            if (lead.source === "Facebook Make") {
                updates.source = "Meta Marketing";
                hasUpdates = true;
            }

            // 4. Update notes if it mentions Make.com
            if (lead.notes && lead.notes.includes("Make.com")) {
                updates.notes = lead.notes.replace("Imported via Make.com", "Imported via Meta Marketing");
                hasUpdates = true;
            }

            if (hasUpdates) {
                await db
                    .update(leads)
                    .set(updates)
                    .where(eq(leads.id, lead.id));

                console.log(`✅ Updated Lead ID ${lead.id} ("${lead.name}")`);
                updated++;
            } else {
                skipped++;
            }
        }

        console.log(`\n✨ Migration complete!`);
        console.log(`   Updated: ${updated} leads`);
        console.log(`   Skipped: ${skipped} leads`);
        console.log(`\n⚠️  Note: Leads without father names need manual review.`);
        console.log(`   You may need to check the original Meta lead data or Make.com logs.`);

    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }

    process.exit(0);
}

// Run the migration
migrateMetaLeadData();
