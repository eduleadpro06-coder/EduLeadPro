
const postgres = require('postgres');
require('dotenv').config();

async function checkNotifications() {
    const sql = postgres(process.env.DATABASE_URL);
    try {
        const rows = await sql`SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10`;
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await sql.end();
    }
}

checkNotifications();
