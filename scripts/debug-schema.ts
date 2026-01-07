import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';

async function checkSchema() {
    try {
        console.log('--- Checking staff table columns ---');
        const staffCols = await db.execute(sql`
            SELECT column_name
            FROM information_schema.columns 
            WHERE table_name = 'staff'
        `);
        const names = (staffCols.rows || staffCols).map((r: any) => r.column_name).join(', ');
        console.log('Columns:', names);

        console.log('\n--- Checking leads table columns ---');
        const leadsCols = await db.execute(sql`
            SELECT column_name
            FROM information_schema.columns 
            WHERE table_name = 'leads'
        `);
        const leadsNames = (leadsCols.rows || leadsCols).map((r: any) => r.column_name).join(', ');
        console.log('Columns:', leadsNames);

        process.exit(0);
    } catch (error) {
        console.error('Error checking schema:', error);
        process.exit(1);
    }
}

checkSchema();
