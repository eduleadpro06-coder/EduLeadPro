
import 'dotenv/config';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function checkTable() {
    console.log('Checking for table: teacher_student_assignments');
    try {
        const result = await db.execute(sql`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'teacher_student_assignments'
            );
        `);
        console.log('Result:', result);
    } catch (err) {
        console.error('Error checking table:', err);
    }
}

checkTable();
