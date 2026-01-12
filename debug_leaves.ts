
import 'dotenv/config';
import postgres from "postgres";
import fs from 'fs';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const sql = postgres(connectionString, { ssl: { rejectUnauthorized: false } });

async function checkData() {
    try {
        const output = [];

        // Check teacher_leaves
        output.push("--- Checking teacher_leaves table ---");
        const leaves = await sql`SELECT * FROM teacher_leaves`;
        output.push(`Total leaves found: ${leaves.length}`);
        output.push(JSON.stringify(leaves, null, 2));

        // Check staff
        output.push("\n--- Checking staff table for Amruta ---");
        const staff = await sql`SELECT * FROM staff WHERE email LIKE '%amruta%'`;
        output.push(`Staff records matching 'amruta': ${JSON.stringify(staff, null, 2)}`);

        fs.writeFileSync('debug_output.txt', output.join('\n'));
        console.log("Output written to debug_output.txt");

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await sql.end();
    }
}

checkData();
