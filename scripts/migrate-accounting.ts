
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function runMigration() {
    console.log("Starting manual accounting migration...");

    try {
        // 1. Account Master
        console.log("Creating account_master...");
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS account_master (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        name VARCHAR(200) NOT NULL,
        code VARCHAR(50),
        type VARCHAR(50) NOT NULL,
        parent_id INTEGER REFERENCES account_master(id),
        is_system BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

        // 2. Bank Statements
        console.log("Creating bank_statements...");
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS bank_statements (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        filename VARCHAR(255) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        file_url TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        uploaded_by INTEGER REFERENCES users(id),
        total_transactions INTEGER DEFAULT 0,
        processed_transactions INTEGER DEFAULT 0,
        error_log TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

        // 3. Bank Transactions
        console.log("Creating bank_transactions...");
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS bank_transactions (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        statement_id INTEGER NOT NULL REFERENCES bank_statements(id),
        date DATE NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        type VARCHAR(20) NOT NULL,
        reference VARCHAR(200),
        balance DECIMAL(12, 2),
        status VARCHAR(20) DEFAULT 'pending',
        confidence_score DECIMAL(5, 2),
        suggested_account_id INTEGER REFERENCES account_master(id),
        classification_reason TEXT,
        row_hash VARCHAR(64) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

        // 4. Ledger Entries
        console.log("Creating ledger_entries...");
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ledger_entries (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        transaction_id INTEGER REFERENCES bank_transactions(id),
        account_id INTEGER NOT NULL REFERENCES account_master(id),
        debit DECIMAL(12, 2) DEFAULT '0',
        credit DECIMAL(12, 2) DEFAULT '0',
        description TEXT,
        entry_date DATE NOT NULL,
        posted_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

        // 5. Classification Rules
        console.log("Creating classification_rules...");
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS classification_rules (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        name VARCHAR(100) NOT NULL,
        priority INTEGER DEFAULT 0,
        rule_type VARCHAR(50) DEFAULT 'keyword',
        pattern TEXT NOT NULL,
        target_account_id INTEGER NOT NULL REFERENCES account_master(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

        // 6. Classification Feedback
        console.log("Creating classification_feedback...");
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS classification_feedback (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        transaction_description TEXT NOT NULL,
        correct_account_id INTEGER NOT NULL REFERENCES account_master(id),
        user_correction BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

        // 7. Accounting Audit Logs
        console.log("Creating accounting_audit_logs...");
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS accounting_audit_logs (
        id SERIAL PRIMARY KEY,
        organization_id INTEGER NOT NULL REFERENCES organizations(id),
        entity_type VARCHAR(50) NOT NULL,
        entity_id INTEGER NOT NULL,
        action VARCHAR(50) NOT NULL,
        changes JSONB,
        performed_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

        console.log("Migration completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

runMigration();
