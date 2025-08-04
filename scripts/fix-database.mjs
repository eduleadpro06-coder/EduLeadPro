import 'dotenv/config';
import { drizzle } from "drizzle-orm/postgres-js";
import pkg from "postgres";
const postgres = pkg;
import { sql } from 'drizzle-orm';

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

async function fixFeePaymentsTable() {
  try {
    console.log('Checking and fixing fee_payments table...');
    
    // Add discount column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'fee_payments' AND column_name = 'discount') THEN
              ALTER TABLE fee_payments ADD COLUMN discount numeric(10, 2) DEFAULT '0';
              RAISE NOTICE 'Added discount column to fee_payments table';
          ELSE
              RAISE NOTICE 'discount column already exists in fee_payments table';
          END IF;
      END $$;
    `);
    
    // Add payment_mode column if it doesn't exist
    await db.execute(sql`
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'fee_payments' AND column_name = 'payment_mode') THEN
              ALTER TABLE fee_payments ADD COLUMN payment_mode varchar(20) NOT NULL DEFAULT 'cash';
              RAISE NOTICE 'Added payment_mode column to fee_payments table';
          ELSE
              RAISE NOTICE 'payment_mode column already exists in fee_payments table';
          END IF;
      END $$;
    `);
    
    // Show the table structure
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'fee_payments' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\nCurrent fee_payments table structure:');
    console.table(result);
    
    console.log('\nDatabase fix completed successfully!');
    
  } catch (error) {
    console.error('Error fixing database:', error);
  } finally {
    await client.end();
  }
}

fixFeePaymentsTable(); 