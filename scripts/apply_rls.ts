
import 'dotenv/config';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

async function applyRLS() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = postgres(connectionString);
  const sqlFilePath = path.join(process.cwd(), 'scripts', 'enable_rls_all_tables.sql');

  try {
    console.log("Reading SQL script...");
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log("Applying RLS to all tables in the public schema...");
    await sql.unsafe(sqlContent);
    
    console.log("Successfully enabled Row Level Security on all tables.");
  } catch (err) {
    console.error("Error applying RLS:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applyRLS();
