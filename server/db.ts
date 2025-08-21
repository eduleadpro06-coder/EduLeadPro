import 'dotenv/config';
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema.js";

// Connection string from environment variables
const connectionString = process.env.DATABASE_URL;

// Validate that DATABASE_URL is set
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set. Please check your .env file.");
}

// Create postgres client
const client = postgres(connectionString);
const db = drizzle(client, { schema });

// Export all schema for convenience
export * from "../shared/schema.js";

// Export db
export { db };

// Optional: Test the connection only when explicitly enabled.
// This avoids running an async query at import time in serverless environments.
if (process.env.DB_TEST_AT_START === 'true') {
  (async () => {
    try {
      await db.select().from(schema.leads).limit(1);
      console.log("Database connection successful");
    } catch (error) {
      console.error("Database connection failed:", error);
    }
  })();
}