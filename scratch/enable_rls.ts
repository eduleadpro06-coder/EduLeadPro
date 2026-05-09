import 'dotenv/config';
import postgres from 'postgres';

// Ensure we bypass TLS rejection locally if needed
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = postgres(connectionString);

async function enableRlsOnAllTables() {
  try {
    // Get all tables in the public schema
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE';
    `;
    
    console.log(`Found ${tables.length} tables in public schema.`);
    
    for (const row of tables) {
      const tableName = row.table_name;
      console.log(`Enabling RLS on: ${tableName}`);
      // Enable RLS
      await sql.unsafe(`ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY;`);
    }
    
    console.log("Successfully enabled RLS on all tables.");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

enableRlsOnAllTables();
