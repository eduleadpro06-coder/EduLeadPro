import { db } from './db';
import { sql } from 'drizzle-orm';
import { staff } from '@shared/schema';

async function initializeDatabase() {
  try {
    console.log('Checking if global_class_fees table exists...');
    
    // Check if table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'global_class_fees'
      );
    `);
    
    console.log('Table exists:', tableExists[0]?.exists);
    
    if (!tableExists[0]?.exists) {
      console.log('Creating global_class_fees table...');
      
      // Create the table
      await db.execute(sql`
        CREATE TABLE global_class_fees (
          id SERIAL PRIMARY KEY,
          class_name VARCHAR(20) NOT NULL,
          fee_type VARCHAR(50) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          frequency VARCHAR(20) NOT NULL,
          academic_year VARCHAR(20) NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
      
      // Create indexes
      await db.execute(sql`
        CREATE INDEX idx_global_class_fees_class_name ON global_class_fees(class_name);
        CREATE INDEX idx_global_class_fees_academic_year ON global_class_fees(academic_year);
        CREATE INDEX idx_global_class_fees_active ON global_class_fees(is_active);
      `);
      
      // Insert sample data
      await db.execute(sql`
        INSERT INTO global_class_fees (class_name, fee_type, amount, frequency, academic_year, description, is_active) VALUES
        ('Class 10', 'tuition', 5000.00, 'monthly', '2024-25', 'Monthly tuition fee for Class 10', true),
        ('Class 10', 'admission', 15000.00, 'one-time', '2024-25', 'One-time admission fee for Class 10', true),
        ('Class 11', 'tuition', 6000.00, 'monthly', '2024-25', 'Monthly tuition fee for Class 11', true),
        ('Class 12', 'tuition', 7000.00, 'monthly', '2024-25', 'Monthly tuition fee for Class 12', true);
      `);
      
      console.log('Global class fees table created successfully with sample data');
    } else {
      console.log('Global class fees table already exists');
    }
    
    // Add sample staff data
    const sampleStaff = [
      {
        employeeId: "EMP001",
        name: "Sarah Johnson",
        email: "sarah.johnson@school.com",
        phone: "+91 98765 43210",
        role: "Admin",
        department: "Administration",
        dateOfJoining: "2023-01-15",
        salary: "75000",
        isActive: true,
        address: "123 Main Street, Bangalore, Karnataka",
        emergencyContact: "+91 98765 43211",
        qualifications: "MBA, B.Tech",
        bankAccountNumber: "1234567890",
        ifscCode: "SBIN0001234",
        panNumber: "ABCDE1234F"
      },
      {
        employeeId: "EMP002",
        name: "Rajesh Kumar",
        email: "rajesh.kumar@school.com",
        phone: "+91 98765 43212",
        role: "Teacher",
        department: "Science",
        dateOfJoining: "2023-02-01",
        salary: "65000",
        isActive: true,
        address: "456 Park Avenue, Bangalore, Karnataka",
        emergencyContact: "+91 98765 43213",
        qualifications: "M.Sc Physics, B.Ed",
        bankAccountNumber: "1234567891",
        ifscCode: "SBIN0001234",
        panNumber: "BCDEF1234G"
      },
      {
        employeeId: "EMP003",
        name: "Priya Sharma",
        email: "priya.sharma@school.com",
        phone: "+91 98765 43214",
        role: "Counselor",
        department: "Student Services",
        dateOfJoining: "2023-03-10",
        salary: "55000",
        isActive: true,
        address: "789 Lake Road, Bangalore, Karnataka",
        emergencyContact: "+91 98765 43215",
        qualifications: "M.A Psychology, Counseling Certificate",
        bankAccountNumber: "1234567892",
        ifscCode: "SBIN0001234",
        panNumber: "CDEFG1234H"
      },
      {
        employeeId: "EMP004",
        name: "Amit Patel",
        email: "amit.patel@school.com",
        phone: "+91 98765 43216",
        role: "Accountant",
        department: "Finance",
        dateOfJoining: "2023-04-05",
        salary: "45000",
        isActive: true,
        address: "321 Garden Street, Bangalore, Karnataka",
        emergencyContact: "+91 98765 43217",
        qualifications: "B.Com, CA Inter",
        bankAccountNumber: "1234567893",
        ifscCode: "SBIN0001234",
        panNumber: "DEFGH1234I"
      },
      {
        employeeId: "EMP005",
        name: "Meera Singh",
        email: "meera.singh@school.com",
        phone: "+91 98765 43218",
        role: "Teacher",
        department: "Mathematics",
        dateOfJoining: "2023-05-20",
        salary: "60000",
        isActive: true,
        address: "654 Hill Road, Bangalore, Karnataka",
        emergencyContact: "+91 98765 43219",
        qualifications: "M.Sc Mathematics, B.Ed",
        bankAccountNumber: "1234567894",
        ifscCode: "SBIN0001234",
        panNumber: "EFGHI1234J"
      },
      {
        employeeId: "EMP006",
        name: "Vikram Reddy",
        email: "vikram.reddy@school.com",
        phone: "+91 98765 43220",
        role: "HR",
        department: "Human Resources",
        dateOfJoining: "2023-06-15",
        salary: "50000",
        isActive: true,
        address: "987 Valley View, Bangalore, Karnataka",
        emergencyContact: "+91 98765 43221",
        qualifications: "MBA HR, PGDHRM",
        bankAccountNumber: "1234567895",
        ifscCode: "SBIN0001234",
        panNumber: "FGHIJ1234K"
      },
      {
        employeeId: "EMP007",
        name: "Anjali Desai",
        email: "anjali.desai@school.com",
        phone: "+91 98765 43222",
        role: "Teacher",
        department: "English",
        dateOfJoining: "2023-07-01",
        salary: "58000",
        isActive: true,
        address: "147 River Side, Bangalore, Karnataka",
        emergencyContact: "+91 98765 43223",
        qualifications: "M.A English, B.Ed",
        bankAccountNumber: "1234567896",
        ifscCode: "SBIN0001234",
        panNumber: "GHIJK1234L"
      },
      {
        employeeId: "EMP008",
        name: "Suresh Iyer",
        email: "suresh.iyer@school.com",
        phone: "+91 98765 43224",
        role: "Support",
        department: "IT Support",
        dateOfJoining: "2023-08-10",
        salary: "35000",
        isActive: true,
        address: "258 Tech Park, Bangalore, Karnataka",
        emergencyContact: "+91 98765 43225",
        qualifications: "B.Tech Computer Science",
        bankAccountNumber: "1234567897",
        ifscCode: "SBIN0001234",
        panNumber: "HIJKL1234M"
      }
    ];

    // Insert sample staff data
    for (const staffData of sampleStaff) {
      try {
        await db.insert(staff).values(staffData);
        console.log(`✅ Added staff: ${staffData.name}`);
      } catch (error) {
        console.log(`⚠️ Staff ${staffData.name} might already exist`);
      }
    }
    
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Run initialization
initializeDatabase(); 