
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Migrating student_bus_assignments schema...");
    try {
        // 1. Rename assigned_date to assigned_at if it exists
        await db.execute(sql`
      DO $$
      BEGIN
        IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'student_bus_assignments' AND column_name = 'assigned_date') THEN
          ALTER TABLE student_bus_assignments RENAME COLUMN assigned_date TO assigned_at;
        END IF;
      END $$;
    `);

        // 2. Add pickup_stop_id and drop_stop_id if they don't exist
        await db.execute(sql`
      ALTER TABLE student_bus_assignments 
      ADD COLUMN IF NOT EXISTS pickup_stop_id integer REFERENCES bus_stops(id),
      ADD COLUMN IF NOT EXISTS drop_stop_id integer REFERENCES bus_stops(id);
    `);

        // 3. Migrate data from stop_id (if exists) -> pickup_stop_id/drop_stop_id
        await db.execute(sql`
      DO $$
      BEGIN
        IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'student_bus_assignments' AND column_name = 'stop_id') THEN
          UPDATE student_bus_assignments SET pickup_stop_id = stop_id, drop_stop_id = stop_id WHERE pickup_stop_id IS NULL;
        END IF;
      END $$;
    `);

        // 4. Drop obsolete columns
        await db.execute(sql`
      ALTER TABLE student_bus_assignments 
      DROP COLUMN IF EXISTS stop_id,
      DROP COLUMN IF EXISTS assignment_type,
      DROP COLUMN IF EXISTS active,
      DROP COLUMN IF EXISTS created_at,
      DROP COLUMN IF EXISTS updated_at;
    `);

        // 5. Ensure assigned_at is not null and default types
        // (Optional but good to match schema strictly if needed, but simple add/drop is usually enough for query validity)

        console.log("Schema migration completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error migrating schema:", error);
        process.exit(1);
    }
}

main();
