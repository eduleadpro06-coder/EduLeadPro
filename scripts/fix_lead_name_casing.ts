/**
 * Migration Script: Normalize all lead names to Title Case
 * 
 * Converts: "YOSHIT HEMANT GEFAM" → "Yoshit Hemant Gefam"
 *           "shriyansh selokar"   → "Shriyansh Selokar"
 *           "Umul khair"          → "Umul Khair"
 * 
 * Run: npx tsx scripts/fix_lead_name_casing.ts
 */
import { db } from "../server/db.js";
import { leads } from "../shared/schema.js";
import { eq } from "drizzle-orm";

function toTitleCase(str: string | null): string | null {
    if (!str) return str;
    return str.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

async function main() {
    console.log("=== Lead Name Casing Normalization ===\n");

    const allLeads = await db.select({
        id: leads.id,
        name: leads.name,
        fatherFirstName: leads.fatherFirstName,
        fatherLastName: leads.fatherLastName,
        motherFirstName: leads.motherFirstName,
        motherLastName: leads.motherLastName,
    }).from(leads);

    console.log(`Processing ${allLeads.length} leads...\n`);

    let fixCount = 0;

    for (const lead of allLeads) {
        const newName = toTitleCase(lead.name);
        const newFatherFirst = toTitleCase(lead.fatherFirstName);
        const newFatherLast = toTitleCase(lead.fatherLastName);
        const newMotherFirst = toTitleCase(lead.motherFirstName);
        const newMotherLast = toTitleCase(lead.motherLastName);

        // Check if anything actually changed
        if (
            newName !== lead.name ||
            newFatherFirst !== lead.fatherFirstName ||
            newFatherLast !== lead.fatherLastName ||
            newMotherFirst !== lead.motherFirstName ||
            newMotherLast !== lead.motherLastName
        ) {
            await db.update(leads)
                .set({
                    name: newName!,
                    fatherFirstName: newFatherFirst,
                    fatherLastName: newFatherLast,
                    motherFirstName: newMotherFirst,
                    motherLastName: newMotherLast,
                })
                .where(eq(leads.id, lead.id));

            console.log(`  Fixed #${lead.id}: "${lead.name}" → "${newName}"`);
            fixCount++;
        }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Total leads: ${allLeads.length}`);
    console.log(`Names fixed: ${fixCount}`);
    console.log("Done!");

    process.exit(0);
}

main().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
