import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  const result = await db.execute(sql`SELECT id, name, display_name, content, category FROM message_templates`);
  console.log(result);
  process.exit(0);
}
run();
