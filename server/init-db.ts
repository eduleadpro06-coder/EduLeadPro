// Database Initialization with Sample Data for AI Systems
import { db } from "./db.js";
import * as schema from "../shared/schema.js";

export async function initializeDatabase() {
  try {
    console.log("Initializing database with sample data for AI systems...");

    // Check if we already have data
    const existingUsers = await db.select().from(schema.users).limit(1);
    if (existingUsers.length > 0) {
      console.log("Database already initialized. Skipping...");
      return;
    }

    // Create admin user
    const [adminUser] = await db.insert(schema.users).values({
      username: 'admin',
      password: '$2b$10$jNW9pSCPxiOK8JRA5Tv3ouzLc15/kSxZZKr7FHE5UqBpGNcKo5QBC', // password: admin123
      role: 'admin',
      email: 'admin@leadeducate.com'
    }).returning();

    // Create counselors
    const counselors = await db.insert(schema.users).values([
      {
        username: 'counselor1',
        password: '$2b$10$jNW9pSCPxiOK8JRA5Tv3ouzLc15/kSxZZKr7FHE5UqBpGNcKo5QBC',
        role: 'counselor',
        email: 'counselor1@leadeducate.com'
      },
      {
        username: 'counselor2',
        password: '$2b$10$jNW9pSCPxiOK8JRA5Tv3ouzLc15/kSxZZKr7FHE5UqBpGNcKo5QBC',
        role: 'counselor',
        email: 'counselor2@leadeducate.com'
      }
    ]).returning();

    // Create staff members
    const staffMembers = await db.insert(schema.staff).values([
      {
        employeeId: 'EMP001',
        name: 'Dr. Rajesh Kumar',
        email: 'rajesh@leadeducate.com',
        phone: '9876543210',
        role: 'Principal',
        department: 'Administration',
        dateOfJoining: new Date('2020-01-15'),
        salary: '100000',
        qualifications: 'PhD in Education',
        bankAccountNumber: '1234567890',
        ifscCode: 'HDFC0001234',
        panNumber: 'ABCDE1234F'
      },
      {
        employeeId: 'EMP002',
        name: 'Priya Sharma',
        email: 'priya@leadeducate.com',
        phone: '9876543211',
        role: 'Teacher',
        department: 'Mathematics',
        dateOfJoining: new Date('2021-03-20'),
        salary: '45000',
        qualifications: 'M.Sc Mathematics, B.Ed',
        bankAccountNumber: '1234567891',
        ifscCode: 'HDFC0001234',
        panNumber: 'ABCDE1234G'
      },
      {
        employeeId: 'EMP003',
        name: 'Amit Singh',
        email: 'amit@leadeducate.com',
        phone: '9876543212',
        role: 'Teacher',
        department: 'Physics',
        dateOfJoining: new Date('2021-06-10'),
        salary: '42000',
        qualifications: 'M.Sc Physics, B.Ed',
        bankAccountNumber: '1234567892',
        ifscCode: 'HDFC0001234',
        panNumber: 'ABCDE1234H'
      },
      {
        employeeId: 'EMP004',
        name: 'Sneha Gupta',
        email: 'sneha@leadeducate.com',
        phone: '9876543213',
        role: 'Teacher',
        department: 'Chemistry',
        dateOfJoining: new Date('2022-01-05'),
        salary: '43000',
        qualifications: 'M.Sc Chemistry, B.Ed',
        bankAccountNumber: '1234567893',
        ifscCode: 'HDFC0001234',
        panNumber: 'ABCDE1234I'
      },
      {
        employeeId: 'EMP005',
        name: 'Rahul Verma',
        email: 'rahul@leadeducate.com',
        phone: '9876543214',
        role: 'Counselor',
        department: 'Student Affairs',
        dateOfJoining: new Date('2021-09-15'),
        salary: '38000',
        qualifications: 'M.A Psychology, Counseling Certification',
        bankAccountNumber: '1234567894',
        ifscCode: 'HDFC0001234',
        panNumber: 'ABCDE1234J'
      }
    ]).returning();

    // Create students
    const students = await db.insert(schema.students).values([
      {
        rollNumber: 'STU001',
        name: 'Arjun Patel',
        email: 'arjun.patel@student.leadeducate.com',
        phone: '9123456780',
        class: 'Class 12',
        stream: 'Science',
        parentName: 'Ramesh Patel',
        parentPhone: '9123456700',
        address: '123 MG Road, Mumbai',
        dateOfBirth: new Date('2005-03-15'),
        admissionDate: new Date('2023-04-01'),
        status: 'active'
      },
      {
        rollNumber: 'STU002',
        name: 'Priyanka Shah',
        email: 'priyanka.shah@student.leadeducate.com',
        phone: '9123456781',
        class: 'Class 12',
        stream: 'Science',
        parentName: 'Suresh Shah',
        parentPhone: '9123456701',
        address: '456 FC Road, Pune',
        dateOfBirth: new Date('2005-07-22'),
        admissionDate: new Date('2023-04-01'),
        status: 'active'
      },
      {
        rollNumber: 'STU003',
        name: 'Rohit Kumar',
        email: 'rohit.kumar@student.leadeducate.com',
        phone: '9123456782',
        class: 'Class 11',
        stream: 'Science',
        parentName: 'Vikash Kumar',
        parentPhone: '9123456702',
        address: '789 Park Street, Delhi',
        dateOfBirth: new Date('2006-01-10'),
        admissionDate: new Date('2023-04-01'),
        status: 'active'
      },
      {
        rollNumber: 'STU004',
        name: 'Kavya Reddy',
        email: 'kavya.reddy@student.leadeducate.com',
        phone: '9123456783',
        class: 'Class 11',
        stream: 'Commerce',
        parentName: 'Rajesh Reddy',
        parentPhone: '9123456703',
        address: '321 Brigade Road, Bangalore',
        dateOfBirth: new Date('2006-05-18'),
        admissionDate: new Date('2023-04-01'),
        status: 'active'
      },
      {
        rollNumber: 'STU005',
        name: 'Manish Agarwal',
        email: 'manish.agarwal@student.leadeducate.com',
        phone: '9123456784',
        class: 'Class 10',
        stream: 'General',
        parentName: 'Sunil Agarwal',
        parentPhone: '9123456704',
        address: '654 Commercial Street, Hyderabad',
        dateOfBirth: new Date('2007-09-30'),
        admissionDate: new Date('2023-04-01'),
        status: 'active'
      }
    ]).returning();

    // Create courses
    const courses = await db.insert(schema.courses).values([
      {
        courseCode: 'CS101',
        courseName: 'Computer Science Fundamentals',
        description: 'Introduction to programming and computer science concepts',
        credits: 4,
        duration: '1 year',
        level: 'beginner',
        department: 'Computer Science',
        prerequisites: '[]',
        learningOutcomes: '["Basic programming skills", "Problem-solving abilities", "Algorithm understanding"]',
        industryRelevance: '95',
        marketDemand: '90',
        currentPrice: '50000',
        isActive: true
      },
      {
        courseCode: 'MATH201',
        courseName: 'Advanced Mathematics',
        description: 'Calculus, algebra, and statistical analysis',
        credits: 3,
        duration: '6 months',
        level: 'intermediate',
        department: 'Mathematics',
        prerequisites: '["Basic Mathematics"]',
        learningOutcomes: '["Advanced calculus", "Statistical analysis", "Mathematical modeling"]',
        industryRelevance: '85',
        marketDemand: '75',
        currentPrice: '35000',
        isActive: true
      },
      {
        courseCode: 'PHY301',
        courseName: 'Applied Physics',
        description: 'Practical applications of physics in engineering',
        credits: 4,
        duration: '1 year',
        level: 'advanced',
        department: 'Physics',
        prerequisites: '["Basic Physics", "Mathematics"]',
        learningOutcomes: '["Applied physics concepts", "Laboratory skills", "Scientific analysis"]',
        industryRelevance: '80',
        marketDemand: '70',
        currentPrice: '45000',
        isActive: true
      }
    ]).returning();

    // Create academic records
    await db.insert(schema.academicRecords).values([
      {
        studentId: students[0].id,
        term: 'Semester 1',
        subject: 'Mathematics',
        marksObtained: '85',
        totalMarks: '100',
        grade: 'A',
        attendance: '92',
        teacherRemarks: 'Excellent performance in calculus'
      },
      {
        studentId: students[0].id,
        term: 'Semester 1',
        subject: 'Physics',
        marksObtained: '78',
        totalMarks: '100',
        grade: 'B+',
        attendance: '88',
        teacherRemarks: 'Good understanding of concepts'
      },
      {
        studentId: students[1].id,
        term: 'Semester 1',
        subject: 'Mathematics',
        marksObtained: '92',
        totalMarks: '100',
        grade: 'A+',
        attendance: '96',
        teacherRemarks: 'Outstanding mathematical skills'
      },
      {
        studentId: students[2].id,
        term: 'Semester 1',
        subject: 'Chemistry',
        marksObtained: '68',
        totalMarks: '100',
        grade: 'B',
        attendance: '75',
        teacherRemarks: 'Needs improvement in practical work'
      },
      {
        studentId: students[3].id,
        term: 'Semester 1',
        subject: 'Accountancy',
        marksObtained: '89',
        totalMarks: '100',
        grade: 'A',
        attendance: '90',
        teacherRemarks: 'Strong in financial concepts'
      }
    ]);

    // Create student engagement data
    await db.insert(schema.studentEngagement).values([
      {
        studentId: students[0].id,
        activityType: 'assignment',
        engagementScore: '88',
        timeSpent: 120,
        participationLevel: 'high',
        date: '2024-08-15',
        metadata: '{"subject": "Mathematics", "difficulty": "medium"}'
      },
      {
        studentId: students[0].id,
        activityType: 'quiz',
        engagementScore: '75',
        timeSpent: 45,
        participationLevel: 'medium',
        date: '2024-08-16',
        metadata: '{"subject": "Physics", "score": "18/20"}'
      },
      {
        studentId: students[1].id,
        activityType: 'project',
        engagementScore: '95',
        timeSpent: 300,
        participationLevel: 'high',
        date: '2024-08-17',
        metadata: '{"subject": "Mathematics", "type": "research"}'
      },
      {
        studentId: students[2].id,
        activityType: 'assignment',
        engagementScore: '60',
        timeSpent: 80,
        participationLevel: 'low',
        date: '2024-08-18',
        metadata: '{"subject": "Chemistry", "difficulty": "high"}'
      }
    ]);

    // Create some leads for AI analysis
    await db.insert(schema.leads).values([
      {
        name: 'Ravi Mehta',
        email: 'ravi.mehta@email.com',
        phone: '9987654321',
        class: 'Class 12',
        stream: 'Science',
        status: 'interested',
        source: 'google_ads',
        counselorId: counselors[0].id,
        assignedAt: new Date(),
        lastContactedAt: new Date(),
        admissionLikelihood: '75.5',
        parentName: 'Mukesh Mehta',
        parentPhone: '9987654300',
        address: '123 Sector 15, Noida',
        interestedProgram: 'Engineering Entrance Preparation'
      },
      {
        name: 'Ananya Joshi',
        email: 'ananya.joshi@email.com',
        phone: '9876543210',
        class: 'Class 11',
        stream: 'Commerce',
        status: 'new',
        source: 'facebook',
        counselorId: counselors[1].id,
        assignedAt: new Date(),
        admissionLikelihood: '85.2',
        parentName: 'Deepak Joshi',
        parentPhone: '9876543200',
        address: '456 MG Road, Jaipur',
        interestedProgram: 'Commerce Stream'
      },
      {
        name: 'Karthik Rao',
        email: 'karthik.rao@email.com',
        phone: '9765432109',
        class: 'Class 10',
        stream: 'General',
        status: 'contacted',
        source: 'referral',
        counselorId: counselors[0].id,
        assignedAt: new Date(),
        lastContactedAt: new Date(),
        admissionLikelihood: '62.8',
        parentName: 'Suresh Rao',
        parentPhone: '9765432100',
        address: '789 Brigade Road, Chennai',
        interestedProgram: 'General Studies'
      }
    ]);

    // Create AI predictions for students
    await db.insert(schema.aiPredictions).values([
      {
        entityType: 'student',
        entityId: students[0].id,
        predictionType: 'success_probability',
        predictionValue: '87.5',
        confidence: '89',
        metadata: '{"factors": ["high_attendance", "good_grades", "active_participation"], "risk_level": "low"}',
        modelVersion: 'v2.1'
      },
      {
        entityType: 'student',
        entityId: students[1].id,
        predictionType: 'success_probability',
        predictionValue: '92.3',
        confidence: '91',
        metadata: '{"factors": ["excellent_grades", "high_engagement", "consistent_performance"], "risk_level": "low"}',
        modelVersion: 'v2.1'
      },
      {
        entityType: 'student',
        entityId: students[2].id,
        predictionType: 'success_probability',
        predictionValue: '65.7',
        confidence: '76',
        metadata: '{"factors": ["low_attendance", "declining_grades", "reduced_engagement"], "risk_level": "high"}',
        modelVersion: 'v2.1'
      },
      {
        entityType: 'student',
        entityId: students[3].id,
        predictionType: 'success_probability',
        predictionValue: '78.9',
        confidence: '82',
        metadata: '{"factors": ["good_grades", "moderate_attendance", "steady_progress"], "risk_level": "medium"}',
        modelVersion: 'v2.1'
      }
    ]);

    // Create AI model performance tracking
    await db.insert(schema.aiModelPerformance).values([
      {
        modelType: 'student_success_prediction',
        modelVersion: 'v2.1',
        accuracyScore: '87.3',
        predictionCount: 150,
        correctPredictions: 131,
        evaluationMetrics: '{"precision": 0.89, "recall": 0.85, "f1_score": 0.87, "auc": 0.91}'
      },
      {
        modelType: 'dynamic_pricing',
        modelVersion: 'v1.8',
        accuracyScore: '82.1',
        predictionCount: 75,
        correctPredictions: 62,
        evaluationMetrics: '{"mae": 2150, "rmse": 3200, "mape": 8.5, "r2": 0.82}'
      },
      {
        modelType: 'curriculum_analysis',
        modelVersion: 'v1.5',
        accuracyScore: '89.4',
        predictionCount: 25,
        correctPredictions: 22,
        evaluationMetrics: '{"alignment_accuracy": 0.89, "gap_detection": 0.91, "trend_prediction": 0.87}'
      }
    ]);

    // Create attendance data
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      for (const staff of staffMembers) {
        const isPresent = Math.random() > 0.1; // 90% attendance rate
        if (isPresent) {
          await db.insert(schema.attendance).values({
            staffId: staff.id,
            date: date.toISOString().split('T')[0],
            checkInTime: new Date(date.getTime() + 9 * 60 * 60 * 1000), // 9 AM
            checkOutTime: new Date(date.getTime() + 17 * 60 * 60 * 1000), // 5 PM
            hoursWorked: '8.00',
            status: Math.random() > 0.95 ? 'late' : 'present'
          });
        }
      }
    }

    console.log("Database initialized successfully with comprehensive sample data!");
    console.log(`Created:
    - ${counselors.length + 1} users (1 admin, ${counselors.length} counselors)
    - ${staffMembers.length} staff members
    - ${students.length} students
    - ${courses.length} courses
    - Academic records and engagement data
    - AI predictions and model performance data
    - 30 days of attendance data`);

  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}