import { db } from "../server/db.js";
import { sql } from "drizzle-orm";

async function fixSchema() {
  console.log("🚀 Starting database schema update for gate logs...");
  
  try {
    // Change offline_id column type from uuid to text
    // We use a cast to ensure existing data is preserved as much as possible
    await db.execute(sql`
      ALTER TABLE student_gate_logs 
      ALTER COLUMN offline_id TYPE text USING offline_id::text;
    `);
    
    console.log("✅ Successfully changed student_gate_logs.offline_id from uuid to text.");
    
    // Also check if any other gate-related schema adjustments are needed
    // Visitor logs also have offline_id? Let's check schema.ts again if needed.
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to update database schema:", error);
    process.exit(1);
  }
}

fixSchema();
