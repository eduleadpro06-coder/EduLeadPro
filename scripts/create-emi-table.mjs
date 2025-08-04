import 'dotenv/config';
import { drizzle } from "drizzle-orm/postgres-js";
import pkg from "postgres";
const postgres = pkg;

// Connection string from environment variables
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

// Create postgres client
const client = postgres(connectionString);

// Create drizzle instance
const db = drizzle(client);

async function createEmiPlansTable() {
  try {
    console.log('Creating emi_plans table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS "emi_plans" (
        "id" serial PRIMARY KEY NOT NULL,
        "student_id" integer NOT NULL,
        "plan_type" varchar(20) NOT NULL,
        "total_amount" numeric(10, 2) NOT NULL,
        "emi_period" integer NOT NULL,
        "emi_amount" numeric(10, 2) NOT NULL,
        "down_payment" numeric(10, 2) DEFAULT '0',
        "discount" numeric(10, 2) DEFAULT '0',
        "interest_rate" numeric(5, 2) DEFAULT '0',
        "start_date" date NOT NULL,
        "frequency" varchar(20) DEFAULT 'monthly',
        "processing_fee" numeric(10, 2) DEFAULT '0',
        "late_fee" numeric(10, 2) DEFAULT '0',
        "receipt_number" varchar(100),
        "status" varchar(20) DEFAULT 'active',
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    
    await client.unsafe(createTableSQL);
    console.log('✅ emi_plans table created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating emi_plans table:', error.message);
  } finally {
    await client.end();
  }
}

createEmiPlansTable(); 