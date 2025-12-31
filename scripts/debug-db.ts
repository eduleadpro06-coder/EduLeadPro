
import { db } from "../server/db";
import { leads } from "../shared/schema";
import { eq, ilike } from "drizzle-orm";

async function main() {
    const results = await db.select().from(leads).where(
        ilike(leads.name, "%Aarshvi%")
    );
    console.log("Leads found:", JSON.stringify(results, null, 2));
}

main().catch(console.error).finally(() => process.exit());
