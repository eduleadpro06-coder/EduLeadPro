

import 'dotenv/config';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigration() {
    console.log('🚀 Applying teacher assignments migration via Drizzle...');

    try {
        const migrationPath = join(process.cwd(), 'db', 'migrations', 'add-teacher-student-assignments.sql');
        const migrationSql = readFileSync(migrationPath, 'utf-8');

        // Execute raw SQL
        // We might need to split statements if Drizzle/Driver doesn't support multiple statements in one go
        // But usually Postgres driver handles it.
        await db.execute(sql.raw(migrationSql));

        console.log('✅ Migration executed successfully.');

    } catch (err) {
        console.error('Error applying migration:', err);
    }
    process.exit(0);
}

runMigration();

runMigration();
