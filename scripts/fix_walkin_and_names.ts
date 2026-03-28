/**
 * Migration Script: Fix remaining data issues
 * 
 * 1. Normalize all Walk-in source variants ("Walk In", "Walk-In", "Walk-in (Google Form)") → "Walk-in"
 * 2. Re-apply Title Case to ALL name fields (student + father + mother) that still have bad casing
 * 
 * Run: npx tsx scripts/fix_walkin_and_names.ts
 */
import { db } from "../server/db.js";
import { leads } from "../shared/schema.js";
import { eq, sql, ilike, or } from "drizzle-orm";

function toTitleCase(str: string | null): string | null {
    if (!str) return str;
    return str.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function needsTitleCase(str: string | null): boolean {
    if (!str || str.trim() === '') return false;
    const titleCased = toTitleCase(str);
    return titleCased !== str;
}

async function main() {
    console.log("=== Walk-in Source & Name Casing Fix ===\n");

    // 1. Normalize Walk-in source variants
    // Find all variants: "Walk In", "Walk-In", "Walk-in (Google Form)", etc.
    const walkInVariants = await db.select({ id: leads.id, name: leads.name, source: leads.source })
        .from(leads)
        .where(
            or(
                ilike(leads.source, '%walk%in%'),
                ilike(leads.source, '%walk-in%')
            )
        );

    let sourceFixCount = 0;
    for (const lead of walkInVariants) {
        if (lead.source !== 'Walk-in') {
            await db.update(leads)
                .set({ source: 'Walk-in' })
                .where(eq(leads.id, lead.id));
            console.log(`  [Source] Lead #${lead.id} (${lead.name}): "${lead.source}" → "Walk-in"`);
            sourceFixCount++;
        }
    }
    console.log(`\nSource fixes: ${sourceFixCount}\n`);

    // 2. Fix ALL name fields (student, father first/last, mother first/last)
    const allLeads = await db.select({
        id: leads.id,
        name: leads.name,
        fatherFirstName: leads.fatherFirstName,
        fatherLastName: leads.fatherLastName,
        motherFirstName: leads.motherFirstName,
        motherLastName: leads.motherLastName,
    }).from(leads);

    let nameFixCount = 0;
    for (const lead of allLeads) {
        const changes: Record<string, string> = {};

        if (needsTitleCase(lead.name)) changes.name = toTitleCase(lead.name)!;
        if (needsTitleCase(lead.fatherFirstName)) changes.fatherFirstName = toTitleCase(lead.fatherFirstName)!;
        if (needsTitleCase(lead.fatherLastName)) changes.fatherLastName = toTitleCase(lead.fatherLastName)!;
        if (needsTitleCase(lead.motherFirstName)) changes.motherFirstName = toTitleCase(lead.motherFirstName)!;
        if (needsTitleCase(lead.motherLastName)) changes.motherLastName = toTitleCase(lead.motherLastName)!;

        if (Object.keys(changes).length > 0) {
            await db.update(leads)
                .set(changes as any)
                .where(eq(leads.id, lead.id));

            const details = Object.entries(changes).map(([k, v]) => `${k}: "${(lead as any)[k]}" → "${v}"`).join(', ');
            console.log(`  [Name] Lead #${lead.id}: ${details}`);
            nameFixCount++;
        }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Source fixes: ${sourceFixCount}`);
    console.log(`Name fixes:   ${nameFixCount}`);
    console.log("Done!");

    process.exit(0);
}

main().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
