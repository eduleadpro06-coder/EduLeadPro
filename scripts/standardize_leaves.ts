import { db } from "../server/db";
import { staff } from "../shared/schema";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Updating all staff to 10 Casual Leaves (CL) and 0 Emergency Leaves (EL)...");
  
  const result = await db.update(staff)
    .set({
      clLimit: 10,
      totalLeaves: 10
    });
    
  console.log("Standardized all staff leave limits.");
  process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
