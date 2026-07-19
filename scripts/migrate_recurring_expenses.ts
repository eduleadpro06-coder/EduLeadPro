import { db } from "../server/db.js";
import { sql } from "drizzle-orm";
import * as schema from "../shared/schema.js";

async function runMigration() {
  console.log("Migrating recurring expenses to new table...");
  try {
    // Select from old columns using raw SQL since they are removed from schema.ts
    const oldExpenses = await db.execute(sql`
      SELECT id, description, amount, category, date, type, deduct_from_budget, organization_id, 
             is_recurring, recurring_interval, next_due_date
      FROM expenses
      WHERE is_recurring = true
    `);
    
    let count = 0;
    for (const row of oldExpenses.rows) {
      if (!row.recurring_interval) continue;

      // map any potential old intervals if necessary
      let interval = String(row.recurring_interval);
      if (interval === 'annually') interval = 'yearly';

      // Insert into the newly created recurringExpenses table
      await db.insert(schema.recurringExpenses).values({
        description: String(row.description),
        amount: String(row.amount),
        category: String(row.category),
        interval: interval,
        startDate: String(row.date),
        nextProcessingDate: row.next_due_date ? String(row.next_due_date) : String(row.date),
        type: row.type ? String(row.type) : "outward",
        deductFromBudget: Boolean(row.deduct_from_budget),
        organizationId: row.organization_id ? Number(row.organization_id) : null,
        isActive: true,
      });
      count++;
    }
    
    console.log(`Successfully migrated ${count} recurring expenses.`);
    console.log("You can now safely run 'npm run db:push' and accept data loss to drop the old columns.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
