
import 'dotenv/config';
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error("DATABASE_URL not set");
    process.exit(1);
}

const sql = postgres(connectionString);

async function main() {
    try {
        console.log("Checking/Adding foreign key constraint to daily_updates...");

        // Add missing foreign key constraint
        await sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_updates_lead_id_fkey') THEN 
          ALTER TABLE daily_updates 
          ADD CONSTRAINT daily_updates_lead_id_fkey 
          FOREIGN KEY (lead_id) 
          REFERENCES leads(id); 
          RAISE NOTICE 'Constraint daily_updates_lead_id_fkey added'; 
        ELSE 
          RAISE NOTICE 'Constraint daily_updates_lead_id_fkey already exists'; 
        END IF; 
      END $$;
    `;

        // Also check student_bus_assignments which was mentioned in code as well
        // It references "leads(id)" -> typically student_bus_assignments_student_id_fkey
        // Just in case

        console.log("Success! Fixed daily_updates relations.");
    } catch (e) {
        console.error("Error fixing constraints:", e);
    } finally {
        await sql.end();
    }
}

main();
