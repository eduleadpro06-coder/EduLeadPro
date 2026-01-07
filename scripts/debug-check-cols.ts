import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';

async function checkSample() {
    try {
        console.log('--- Checking staff table sample ---');
        const staffSample = await db.execute(sql`SELECT * FROM staff LIMIT 1`);
        const staffRows = Array.isArray(staffSample) ? staffSample : (staffSample.rows || []);
        if (staffRows.length > 0) {
            console.log('Staff keys:', Object.keys(staffRows[0]));
        } else {
            console.log('No staff found');
        }

        console.log('\n--- Checking leads table sample ---');
        const leadsSample = await db.execute(sql`SELECT * FROM leads LIMIT 1`);
        const leadsRows = Array.isArray(leadsSample) ? leadsSample : (leadsSample.rows || []);
        if (leadsRows.length > 0) {
            console.log('Leads keys:', Object.keys(leadsRows[0]));
        } else {
            console.log('No leads found');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkSample();
