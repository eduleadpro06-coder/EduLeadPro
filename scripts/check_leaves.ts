import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  try {
    const res = await db.execute(sql`SELECT id, staff_id, organization_id, start_date, reason FROM teacher_leaves LIMIT 10`);
    console.log("Leaves:", res);
    
    const staffRes = await db.execute(sql`SELECT id, name, phone FROM staff LIMIT 5`);
    console.log("Staff:", staffRes);

    const userRes = await db.execute(sql`SELECT id, name FROM users WHERE role IN ('teacher', 'counselor') LIMIT 5`);
    console.log("Users:", userRes);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}

main();
