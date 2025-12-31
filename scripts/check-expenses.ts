
import { db } from "../server/db";
import { expenses } from "../shared/schema";
import { desc } from "drizzle-orm";

async function main() {
    console.log("Checking last 5 expenses...");
    const recentExpenses = await db.select().from(expenses)
        .orderBy(desc(expenses.id))
        .limit(5);

    console.log(JSON.stringify(recentExpenses, null, 2));
    process.exit(0);
}

main().catch(console.error);
