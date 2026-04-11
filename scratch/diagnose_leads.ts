import { db } from '../server/db';
import { leads } from '../shared/schema';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    const stats = await db.select({
      source: leads.source,
      total: sql<number>`cast(count(*) as integer)`,
      enrolled: sql<number>`cast(count(*) filter (where status = 'enrolled') as integer)`
    }).from(leads).groupBy(leads.source);
    
    console.log('--- RAW LEAD DATA BY SOURCE ---');
    stats.sort((a, b) => b.enrolled - a.enrolled).forEach(s => {
      const rate = s.total > 0 ? (s.enrolled / s.total * 100).toFixed(1) : 0;
      console.log(`${s.source || 'Unknown'}: Total=${s.total}, Enrolled=${s.enrolled}, Rate=${rate}%`);
    });
  } catch (e: any) {
    console.error('Error:', e.message);
  }
  process.exit(0);
}
run();
