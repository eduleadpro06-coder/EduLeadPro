import 'dotenv/config';
import { db } from "../server/db";
import * as schema from "../shared/schema";
import { and, eq, or } from "drizzle-orm";

async function main() {
  console.log("Starting deletion of payroll records for January and April...");

  try {
    const result = await db.delete(schema.payroll)
      .returning();

    console.log(`Successfully deleted ${result.length} payroll records.`);
    
    if (result.length > 0) {
        console.log("Deleted IDs:", result.map(p => p.id).join(", "));
    }

    console.log("Note: You may need to refresh the dashboard or clear cache to see updated KPIs.");
  } catch (error) {
    console.error("Error deleting payroll records:", error);
    process.exit(1);
  }

  process.exit(0);
}

main();
