import { db } from "./server/db.js";
import { sql } from "drizzle-orm";

async function migrateDaycare() {
    try {
        console.log("Creating Daycare Management tables...");

        // 1. Daycare Children
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS daycare_children (
        id SERIAL PRIMARY KEY,
        child_id VARCHAR(50) UNIQUE NOT NULL,
        child_name VARCHAR(100) NOT NULL,
        date_of_birth DATE,
        age_years INTEGER,
        age_months INTEGER,
        gender VARCHAR(10),
        blood_group VARCHAR(10),
        photo_url TEXT,
        parent_name VARCHAR(100) NOT NULL,
        parent_phone VARCHAR(20) NOT NULL,
        parent_email VARCHAR(255),
        alternate_phone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(10),
        emergency_contact_name VARCHAR(100),
        emergency_contact_phone VARCHAR(20),
        emergency_contact_relation VARCHAR(50),
        allergies TEXT,
        medical_conditions TEXT,
        special_needs TEXT,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        deleted_at TIMESTAMP
      )
    `);
        console.log("✓ Created daycare_children table");

        // 2. Daycare Inquiries
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS daycare_inquiries (
        id SERIAL PRIMARY KEY,
        inquiry_number VARCHAR(50) UNIQUE NOT NULL,
        child_name VARCHAR(100) NOT NULL,
        child_age_years INTEGER,
        child_age_months INTEGER,
        parent_name VARCHAR(100) NOT NULL,
        parent_phone VARCHAR(20) NOT NULL,
        parent_email VARCHAR(255),
        preferred_start_date DATE,
        preferred_timings VARCHAR(50),
        source VARCHAR(100),
        status VARCHAR(20) DEFAULT 'new',
        assigned_to INTEGER REFERENCES users(id),
        priority VARCHAR(20) DEFAULT 'medium',
        notes TEXT,
        follow_up_date DATE,
        last_contacted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
        console.log("✓ Created daycare_inquiries table");

        // 3. Daycare Inquiry Follow-ups
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS daycare_inquiry_followups (
        id SERIAL PRIMARY KEY,
        inquiry_id INTEGER REFERENCES daycare_inquiries(id) NOT NULL,
        scheduled_at TIMESTAMP NOT NULL,
        completed_at TIMESTAMP,
        followup_type VARCHAR(30),
        status VARCHAR(20) DEFAULT 'pending',
        notes TEXT,
        outcome VARCHAR(30),
        next_action TEXT,
        assigned_to INTEGER REFERENCES users(id),
        completed_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
        console.log("✓ Created daycare_inquiry_followups table");

        // 4. Daycare Billing Config
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS daycare_billing_config (
        id SERIAL PRIMARY KEY,
        config_name VARCHAR(100) NOT NULL,
        hourly_rate DECIMAL(10, 2),
        min_hourly_charge_minutes INTEGER DEFAULT 60,
        half_day_rate DECIMAL(10, 2),
        half_day_hours INTEGER DEFAULT 4,
        full_day_rate DECIMAL(10, 2),
        full_day_hours INTEGER DEFAULT 8,
        monthly_unlimited_rate DECIMAL(10, 2),
        grace_period_minutes INTEGER DEFAULT 15,
        late_pickup_charge_per_hour DECIMAL(10, 2),
        registration_fee DECIMAL(10, 2),
        security_deposit DECIMAL(10, 2),
        is_active BOOLEAN DEFAULT true,
        effective_from DATE,
        effective_until DATE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
        console.log("✓ Created daycare_billing_config table");

        // 5. Daycare Enrollments
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS daycare_enrollments (
        id SERIAL PRIMARY KEY,
        child_id INTEGER REFERENCES daycare_children(id) NOT NULL,
        enrollment_number VARCHAR(50) UNIQUE NOT NULL,
        enrollment_date DATE NOT NULL,
        billing_plan_id INTEGER REFERENCES daycare_billing_config(id),
        custom_hourly_rate DECIMAL(10, 2),
        custom_half_day_rate DECIMAL(10, 2),
        custom_full_day_rate DECIMAL(10, 2),
        custom_monthly_rate DECIMAL(10, 2),
        status VARCHAR(20) DEFAULT 'active',
        start_date DATE NOT NULL,
        end_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        deleted_at TIMESTAMP
      )
    `);
        console.log("✓ Created daycare_enrollments table");

        // 6. Daycare Attendance
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS daycare_attendance (
        id SERIAL PRIMARY KEY,
        enrollment_id INTEGER REFERENCES daycare_enrollments(id) NOT NULL,
        attendance_date DATE NOT NULL,
        check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
        check_out_time TIMESTAMP WITH TIME ZONE,
        duration_minutes INTEGER,
        billing_type VARCHAR(20),
        calculated_charge DECIMAL(10, 2),
        checked_in_by INTEGER REFERENCES users(id),
        checked_out_by INTEGER REFERENCES users(id),
        notes TEXT,
        is_manual_edit BOOLEAN DEFAULT false,
        edited_by INTEGER REFERENCES users(id),
        edit_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
        console.log("✓ Created daycare_attendance table");

        // 7. Daycare Payments
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS daycare_payments (
        id SERIAL PRIMARY KEY,
        payment_number VARCHAR(50) UNIQUE NOT NULL,
        child_id INTEGER REFERENCES daycare_children(id) NOT NULL,
        enrollment_id INTEGER REFERENCES daycare_enrollments(id),
        payment_type VARCHAR(30),
        billing_period_start DATE,
        billing_period_end DATE,
        amount DECIMAL(10, 2) NOT NULL,
        discount DECIMAL(10, 2) DEFAULT 0,
        late_fee DECIMAL(10, 2) DEFAULT 0,
        total_amount DECIMAL(10, 2) NOT NULL,
        payment_date DATE NOT NULL,
        payment_mode VARCHAR(30),
        transaction_id VARCHAR(100),
        cheque_number VARCHAR(50),
        status VARCHAR(20) DEFAULT 'pending',
        receipt_number VARCHAR(50) UNIQUE,
        collected_by INTEGER REFERENCES users(id),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
        console.log("✓ Created daycare_payments table");

        // Create indexes
        console.log("Creating indexes...");
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_daycare_children_parent_phone ON daycare_children(parent_phone)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_daycare_children_status ON daycare_children(status)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_daycare_inquiries_status ON daycare_inquiries(status)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_daycare_enrollments_child_id ON daycare_enrollments(child_id)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_daycare_attendance_date ON daycare_attendance(attendance_date)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_daycare_payments_child ON daycare_payments(child_id)`);
        console.log("✓ Created indexes");

        // Insert default billing config
        console.log("Inserting default billing configuration...");
        await db.execute(sql`
      INSERT INTO daycare_billing_config (
        config_name, hourly_rate, min_hourly_charge_minutes,
        half_day_rate, half_day_hours, full_day_rate, full_day_hours,
        monthly_unlimited_rate, grace_period_minutes,
        late_pickup_charge_per_hour, registration_fee, security_deposit,
        is_active, effective_from
      ) VALUES (
        'Default Daycare Pricing', 100.00, 60,
        350.00, 4, 600.00, 8,
        12000.00, 15, 50.00, 1000.00, 2000.00,
        true, CURRENT_DATE
      ) ON CONFLICT DO NOTHING
    `);
        console.log("✓ Inserted default billing configuration");

        console.log("\n✅ Daycare Management migration completed successfully!");
    } catch (err) {
        console.error("❌ Migration failed:", err);
        throw err;
    }
}

migrateDaycare()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
