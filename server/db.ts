import 'dotenv/config';
import { drizzle } from "drizzle-orm/postgres-js";
import pkg from "postgres";
const postgres = pkg;
import * as schema from "../shared/schema";

// Connection string from environment variables
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL environment variable is not set. Using SQLite for development.");
  // For development, we'll use a simple in-memory database or create a local SQLite file
  // This allows the application to work without PostgreSQL setup
}

// Create postgres client only if DATABASE_URL is available
let client: any = null;
let db: any = null;

if (connectionString) {
  client = postgres(connectionString);
  db = drizzle(client, { schema });
} else {
  // For development without PostgreSQL, create a mock database
  console.log("Running in development mode without database connection");
  // We'll handle this in the storage layer
}

// Export all schema for convenience
export * from "../shared/schema";

// Export db with fallback
export { db };

(async () => {
  const result = await db.select().from(schema.leads);
  console.log(result);
})();