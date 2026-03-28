/**
 * Migration Script: Clean up Google Form lead data
 * 
 * 1. Renames source "Walk-in (Google Form)" → "Walk-in"
 * 2. Trims class names by removing parenthetical age ranges
 *    e.g. "Nursery (3 yrs to 4 yrs)" → "Nursery"
 * 
 * Run: npx tsx scripts/fix_google_form_leads.ts
 */
import { db } from "../server/db.js";
import { leads } from "../shared/schema.js";
import { eq, like, sql } from "drizzle-orm";

async function main() {
    console.log("=== Google Form Lead Data Cleanup ===\n");

    // 1. Fix source: "Walk-in (Google Form)" → "Walk-in"
    const sourceResult = await db.update(leads)
        .set({ source: "Walk-in" })
        .where(eq(leads.source, "Walk-in (Google Form)"))
        .returning({ id: leads.id, name: leads.name });

    console.log(`[Source Fix] Updated ${sourceResult.length} leads from "Walk-in (Google Form)" → "Walk-in":`);
    sourceResult.forEach(l => console.log(`  - Lead #${l.id}: ${l.name}`));

    // 2. Fix class names: strip "(anything)" suffix
    // First, find all leads whose class contains parentheses
    const leadsWithParens = await db.select({
        id: leads.id,
        name: leads.name,
        class: leads.class
    })
    .from(leads)
    .where(like(leads.class, "%(%"));

    console.log(`\n[Class Fix] Found ${leadsWithParens.length} leads with parenthetical class names:`);

    let classFixCount = 0;
    for (const lead of leadsWithParens) {
        const trimmed = lead.class.replace(/\s*\(.*\)\s*$/, '').trim();
        if (trimmed !== lead.class && trimmed.length > 0) {
            await db.update(leads)
                .set({ class: trimmed })
                .where(eq(leads.id, lead.id));
            console.log(`  - Lead #${lead.id} (${lead.name}): "${lead.class}" → "${trimmed}"`);
            classFixCount++;
        }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Source fixes: ${sourceResult.length}`);
    console.log(`Class fixes:  ${classFixCount}`);
    console.log("Done!");

    process.exit(0);
}

main().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
