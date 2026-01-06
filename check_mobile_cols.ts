import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function main() {
    try {
        const tables = ['daily_updates', 'student_attendance', 'preschool_announcements', 'preschool_events', 'preschool_homework'];
        for (const table of tables) {
            const columns = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = ${table}`);
            console.log(`COLUMNS_${table.toUpperCase()}_START`);
            console.log(JSON.stringify(columns, null, 2));
            console.log(`COLUMNS_${table.toUpperCase()}_END`);
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
main();
