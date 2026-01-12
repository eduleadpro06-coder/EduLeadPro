
import 'dotenv/config';
import postgres from "postgres";

async function fixSchema() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error("DATABASE_URL not set");
    }

    const sql = postgres(connectionString);

    try {
        console.log("Checking and fixing database schema...");

        // 1. Add cl_limit and el_limit to staff table
        console.log("Adding cl_limit/el_limit to staff...");
        await sql`
            ALTER TABLE staff 
            ADD COLUMN IF NOT EXISTS cl_limit INTEGER DEFAULT 10,
            ADD COLUMN IF NOT EXISTS el_limit INTEGER DEFAULT 5;
        `;
        console.log("Staff table updated.");

        // 2. Add leave_type to teacher_leaves table
        console.log("Adding leave_type to teacher_leaves...");
        await sql`
            ALTER TABLE teacher_leaves 
            ADD COLUMN IF NOT EXISTS leave_type VARCHAR(20) DEFAULT 'CL' NOT NULL;
        `;
        console.log("Teacher leaves table updated.");

        console.log("Schema fix completed successfully.");
    } catch (error) {
        console.error("Schema fix failed:", error);
    } finally {
        await sql.end();
    }
}

fixSchema();
