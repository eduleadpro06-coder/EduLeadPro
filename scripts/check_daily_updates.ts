import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    const result = await db.execute(sql`SELECT id, organization_id, lead_id, title, activity_type, status, media_urls FROM daily_updates ORDER BY posted_at DESC LIMIT 5`);
    console.log(result.rows || result);
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}
run();
