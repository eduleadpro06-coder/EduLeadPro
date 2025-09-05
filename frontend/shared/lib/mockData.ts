export const mockDashboardData = {
  stats: {
    totalLeads: 1250,
    hotLeads: 45,
    conversions: 320,
    revenue: 2500000,
    newLeadsToday: 28,
    conversionRate: 25.6,
    revenueGrowth: 15.2,
    activeStudents: 850,
    staffAttendance: 95,
    leadTrend: 12.5,
    studentTrend: 8.3,
    conversionTrend: 5.2,
    revenueTrend: 15.2
  },
  leadSources: [
    { source: "website", totalLeads: 456, conversionRate: 32 },
    { source: "referral", totalLeads: 312, conversionRate: 45 },
    { source: "social_media", totalLeads: 284, conversionRate: 28 },
    { source: "walk_in", totalLeads: 196, conversionRate: 38 }
  ],
  enrollmentTrend: [
    { month: "Jan", enrollments: 45 },
    { month: "Feb", enrollments: 52 },
    { month: "Mar", enrollments: 48 },
    { month: "Apr", enrollments: 58 },
    { month: "May", enrollments: 65 },
    { month: "Jun", enrollments: 72 }
  ],
  aiForecast: {
    predictedEnrollments: 78,
    confidence: 0.89,
    trends: {
      leadQuality: "increasing",
      conversionRate: "stable",
      revenue: "increasing"
    },
    insights: [
      {
        type: "opportunity",
        title: "High-Value Lead Segment",
        description: "25% increase in leads from premium segment",
        impact: "high"
      },
      {
        type: "risk",
        title: "Competition Alert",
        description: "New competitor entering local market",
        impact: "medium"
      },
      {
        type: "trend",
        title: "Seasonal Pattern",
        description: "Enrollment peak expected in August",
        impact: "low"
      }
    ]
  },
  recentLeads: [
    {
      id: 1,
      name: "Rahul Sharma",
      email: "rahul.sharma@email.com",
      phone: "+91 98765 43210",
      source: "website",
      status: "hot",
      lastContact: "2024-03-15",
      counselor: "Priya Patel"
    },
    {
      id: 2,
      name: "Ananya Singh",
      email: "ananya.singh@email.com",
      phone: "+91 87654 32109",
      source: "referral",
      status: "warm",
      lastContact: "2024-03-14",
      counselor: "Rajesh Kumar"
    },
    {
      id: 3,
      name: "Vikram Mehta",
      email: "vikram.mehta@email.com",
      phone: "+91 76543 21098",
      source: "social_media",
      status: "cold",
      lastContact: "2024-03-13",
      counselor: "Priya Patel"
    }
  ],
  alerts: [
    {
      type: "followup",
      title: "Follow-up Overdue",
      description: "Multiple leads - 2+ days overdue",
      severity: "high",
      count: 12
    },
    {
      type: "inactive",
      title: "High-Value Lead Inactive",
      description: "Interested leads - No activity for 5+ days",
      severity: "medium",
      count: 8
    },
    {
      type: "new",
      title: "New Leads Assigned",
      description: "28 new leads today",
      severity: "low",
      count: 28
    }
  ],
  leadManagement: {
    totalLeads: 1250,
    activeLeads: 450,
    hotLeads: 85,
    conversionRate: 32,
    recentLeads: [
      {
        id: "L001",
        name: "John Smith",
        email: "john.smith@email.com",
        phone: "+1 (555) 123-4567",
        source: "Website",
        status: "Hot",
        lastContact: "2024-03-15T10:30:00",
        notes: "Interested in Data Science program, scheduled follow-up call",
        assignedTo: "Sarah Johnson"
      },
      {
        id: "L002",
        name: "Emily Chen",
        email: "emily.chen@email.com",
        phone: "+1 (555) 234-5678",
        source: "Referral",
        status: "Warm",
        lastContact: "2024-03-14T15:45:00",
        notes: "Considering Business Administration, needs scholarship info",
        assignedTo: "Michael Brown"
      },
      {
        id: "L003",
        name: "Robert Wilson",
        email: "robert.wilson@email.com",
        phone: "+1 (555) 345-6789",
        source: "Social Media",
        status: "New",
        lastContact: "2024-03-15T09:15:00",
        notes: "Interested in Computer Science, requested program details",
        assignedTo: "Sarah Johnson"
      },
      {
        id: "L004",
        name: "Maria Garcia",
        email: "maria.garcia@email.com",
        phone: "+1 (555) 456-7890",
        source: "Website",
        status: "Hot",
        lastContact: "2024-03-14T14:20:00",
        notes: "Ready to enroll in Nursing program, needs financial aid info",
        assignedTo: "Michael Brown"
      },
      {
        id: "L005",
        name: "David Kim",
        email: "david.kim@email.com",
        phone: "+1 (555) 567-8901",
        source: "Email Campaign",
        status: "Warm",
        lastContact: "2024-03-15T11:00:00",
        notes: "Interested in Engineering, requested campus tour",
        assignedTo: "Sarah Johnson"
      }
    ],
    leadSources: [
      {
        source: "Website",
        count: 450,
        conversionRate: 35
      },
      {
        source: "Referral",
        count: 280,
        conversionRate: 42
      },
      {
        source: "Social Media",
        count: 320,
        conversionRate: 28
      },
      {
        source: "Email Campaign",
        count: 200,
        conversionRate: 25
      }
    ],
    leadStatus: [
      {
        status: "Hot",
        count: 85,
        color: "red"
      },
      {
        status: "Warm",
        count: 165,
        color: "orange"
      },
      {
        status: "New",
        count: 200,
        color: "blue"
      }
    ]
  },
  analytics: {
    enrollmentTrend: [
      { month: "Jan", enrollments: 45 },
      { month: "Feb", enrollments: 52 },
      { month: "Mar", enrollments: 48 },
      { month: "Apr", enrollments: 55 },
      { month: "May", enrollments: 60 },
      { month: "Jun", enrollments: 65 },
      { month: "Jul", enrollments: 58 },
      { month: "Aug", enrollments: 62 },
      { month: "Sep", enrollments: 70 },
      { month: "Oct", enrollments: 75 },
      { month: "Nov", enrollments: 80 },
      { month: "Dec", enrollments: 85 }
    ],
    revenueData: [
      { category: "Tuition", amount: 1250000, trend: 12 },
      { category: "Books & Materials", amount: 250000, trend: 8 },
      { category: "Other Services", amount: 150000, trend: -3 }
    ],
    coursePerformance: [
      {
        id: "cs101",
        name: "Introduction to Computer Science",
        enrollments: 120,
        completionRate: 85,
        satisfaction: 4.5
      },
      {
        id: "math101",
        name: "Advanced Mathematics",
        enrollments: 95,
        completionRate: 78,
        satisfaction: 4.2
      },
      {
        id: "eng101",
        name: "English Composition",
        enrollments: 150,
        completionRate: 92,
        satisfaction: 4.8
      }
    ],
    demographics: {
      ageGroups: [
        { group: "18-24", percentage: 35 },
        { group: "25-34", percentage: 45 },
        { group: "35-44", percentage: 15 },
        { group: "45+", percentage: 5 }
      ],
      gender: [
        { type: "Male", percentage: 60 },
        { type: "Female", percentage: 38 },
        { type: "Other", percentage: 2 }
      ],
      locations: [
        { city: "New York", students: 250 },
        { city: "Los Angeles", students: 180 },
        { city: "Chicago", students: 120 },
        { city: "Houston", students: 90 },
        { city: "Miami", students: 70 }
      ]
    },
    leadConversion: {
      totalLeads: 1250,
      convertedLeads: 320,
      conversionRate: 25.6,
      trends: [
        { month: "Jan", leads: 180, conversions: 45 },
        { month: "Feb", leads: 220, conversions: 58 },
        { month: "Mar", leads: 190, conversions: 48 },
        { month: "Apr", leads: 210, conversions: 52 },
        { month: "May", leads: 240, conversions: 62 },
        { month: "Jun", leads: 210, conversions: 55 }
      ],
      sourcePerformance: [
        { source: "Website", leads: 450, conversions: 135, rate: 30 },
        { source: "Referral", leads: 280, conversions: 126, rate: 45 },
        { source: "Social Media", leads: 320, conversions: 89, rate: 28 },
        { source: "Email Campaign", leads: 200, conversions: 50, rate: 25 }
      ]
    },
    revenueAnalytics: {
      totalRevenue: 2500000,
      monthlyRevenue: 450000,
      revenueGrowth: 15.2,
      feeCollection: [
        { month: "Jan", collected: 380000, pending: 45000 },
        { month: "Feb", collected: 420000, pending: 38000 },
        { month: "Mar", collected: 410000, pending: 42000 },
        { month: "Apr", collected: 440000, pending: 35000 },
        { month: "May", collected: 460000, pending: 30000 },
        { month: "Jun", collected: 450000, pending: 32000 }
      ],
      revenueByCategory: [
        { category: "Tuition", amount: 1250000, trend: 12 },
        { category: "Books & Materials", amount: 250000, trend: 8 },
        { category: "Other Services", amount: 150000, trend: -3 },
        { category: "Transportation", amount: 180000, trend: 5 },
        { category: "Hostel", amount: 320000, trend: 15 }
      ]
    },
    studentAnalytics: {
      totalStudents: 850,
      activeStudents: 820,
      newAdmissions: 72,
      classDistribution: [
        { class: "Class 9", count: 180 },
        { class: "Class 10", count: 165 },
        { class: "Class 11", count: 175 },
        { class: "Class 12", count: 170 },
        { class: "Other", count: 160 }
      ],
      streamDistribution: [
        { stream: "Science", count: 320 },
        { stream: "Commerce", count: 280 },
        { stream: "Arts", count: 250 }
      ],
      attendanceTrend: [
        { month: "Jan", rate: 92 },
        { month: "Feb", rate: 94 },
        { month: "Mar", rate: 91 },
        { month: "Apr", rate: 93 },
        { month: "May", rate: 95 },
        { month: "Jun", rate: 94 }
      ]
    },
    staffAnalytics: {
      totalStaff: 85,
      activeStaff: 82,
      attendanceRate: 95,
      departmentDistribution: [
        { department: "Teaching", count: 45 },
        { department: "Administration", count: 20 },
        { department: "Support", count: 15 },
        { department: "Management", count: 5 }
      ],
      performanceMetrics: [
        { month: "Jan", attendance: 94, performance: 88 },
        { month: "Feb", attendance: 95, performance: 90 },
        { month: "Mar", attendance: 93, performance: 89 },
        { month: "Apr", attendance: 96, performance: 91 },
        { month: "May", attendance: 95, performance: 92 },
        { month: "Jun", attendance: 97, performance: 93 }
      ]
    },
    financialHealth: {
      totalExpenses: 1800000,
      profitMargin: 28,
      expenseCategories: [
        { category: "Salaries", amount: 850000, percentage: 47 },
        { category: "Infrastructure", amount: 250000, percentage: 14 },
        { category: "Marketing", amount: 180000, percentage: 10 },
        { category: "Operations", amount: 320000, percentage: 18 },
        { category: "Other", amount: 200000, percentage: 11 }
      ],
      cashFlow: [
        { month: "Jan", income: 420000, expenses: 380000 },
        { month: "Feb", income: 450000, expenses: 390000 },
        { month: "Mar", income: 440000, expenses: 385000 },
        { month: "Apr", income: 460000, expenses: 400000 },
        { month: "May", income: 480000, expenses: 410000 },
        { month: "Jun", income: 470000, expenses: 405000 }
      ]
    }
  }
};

export const mockAnalyticsData = {
  leadConversion: {
    conversionRate: 35.8,
    sourcePerformance: [
      { source: "Google Ads", leads: 150, conversions: 45, rate: 30 },
      { source: "Facebook", leads: 120, conversions: 24, rate: 20 },
      { source: "Referrals", leads: 80, conversions: 32, rate: 40 },
      { source: "Website", leads: 90, conversions: 18, rate: 20 },
      { source: "Walk-ins", leads: 60, conversions: 30, rate: 50 }
    ],
    trends: [
      { month: "Jan", leads: 120, conversions: 36 },
      { month: "Feb", leads: 145, conversions: 43 },
      { month: "Mar", leads: 132, conversions: 40 },
      { month: "Apr", leads: 158, conversions: 48 },
      { month: "May", leads: 142, conversions: 45 },
      { month: "Jun", leads: 165, conversions: 52 }
    ]
  },
  revenueAnalytics: {
    monthlyRevenue: 1250000,
    feeCollection: [
      { month: "Jan", collected: 950000, pending: 150000 },
      { month: "Feb", collected: 980000, pending: 120000 },
      { month: "Mar", collected: 920000, pending: 180000 },
      { month: "Apr", collected: 1050000, pending: 95000 },
      { month: "May", collected: 1120000, pending: 88000 },
      { month: "Jun", collected: 1180000, pending: 82000 }
    ]
  },
  studentAnalytics: {
    activeStudents: 450,
    totalStudents: 480,
    newAdmissions: 35,
    retentionRate: 94.2,
    classDistribution: [
      { class: "Class 6", count: 85, capacity: 100, utilization: 85 },
      { class: "Class 7", count: 92, capacity: 100, utilization: 92 },
      { class: "Class 8", count: 78, capacity: 90, utilization: 86.7 },
      { class: "Class 9", count: 95, capacity: 100, utilization: 95 },
      { class: "Class 10", count: 100, capacity: 100, utilization: 100 }
    ],
    streamDistribution: [
      { stream: "Science", count: 180, percentage: 40 },
      { stream: "Commerce", count: 150, percentage: 33.3 },
      { stream: "Arts", count: 120, percentage: 26.7 }
    ],
    attendanceTrend: [
      { month: "Jan", rate: 92, present: 414, absent: 36 },
      { month: "Feb", rate: 94, present: 423, absent: 27 },
      { month: "Mar", rate: 91, present: 409, absent: 41 },
      { month: "Apr", rate: 93, present: 418, absent: 32 },
      { month: "May", rate: 95, present: 427, absent: 23 },
      { month: "Jun", rate: 94, present: 423, absent: 27 }
    ],
    performanceMetrics: {
      averageScore: 78.5,
      subjectPerformance: [
        { subject: "Mathematics", average: 82, passRate: 92 },
        { subject: "Science", average: 79, passRate: 88 },
        { subject: "English", average: 75, passRate: 85 },
        { subject: "Social Studies", average: 76, passRate: 87 },
        { subject: "Computer Science", average: 81, passRate: 90 }
      ],
      gradeDistribution: [
        { grade: "A+", count: 45, percentage: 10 },
        { grade: "A", count: 90, percentage: 20 },
        { grade: "B+", count: 135, percentage: 30 },
        { grade: "B", count: 90, percentage: 20 },
        { grade: "C", count: 45, percentage: 10 },
        { grade: "D", count: 15, percentage: 3.3 },
        { grade: "F", count: 5, percentage: 1.1 }
      ]
    },
    demographics: {
      genderDistribution: [
        { gender: "Male", count: 225, percentage: 50 },
        { gender: "Female", count: 225, percentage: 50 }
      ],
      ageDistribution: [
        { age: "11-12", count: 85, percentage: 18.9 },
        { age: "13-14", count: 170, percentage: 37.8 },
        { age: "15-16", count: 195, percentage: 43.3 }
      ]
    }
  },
  staffAnalytics: {
    totalStaff: 50,
    activeStaff: 48,
    attendanceRate: 94.5,
    departmentDistribution: [
      { department: "Teaching", count: 25, percentage: 50 },
      { department: "Administration", count: 8, percentage: 16 },
      { department: "Support", count: 12, percentage: 24 },
      { department: "Counseling", count: 5, percentage: 10 }
    ],
    performanceMetrics: [
      { 
        month: "Jan", 
        attendance: 95, 
        performance: 88,
        metrics: {
          teachingQuality: 90,
          studentFeedback: 85,
          administrativeEfficiency: 88,
          parentSatisfaction: 87
        }
      },
      { 
        month: "Feb", 
        attendance: 94, 
        performance: 90,
        metrics: {
          teachingQuality: 92,
          studentFeedback: 88,
          administrativeEfficiency: 89,
          parentSatisfaction: 90
        }
      },
      { 
        month: "Mar", 
        attendance: 93, 
        performance: 89,
        metrics: {
          teachingQuality: 91,
          studentFeedback: 86,
          administrativeEfficiency: 90,
          parentSatisfaction: 88
        }
      },
      { 
        month: "Apr", 
        attendance: 95, 
        performance: 92,
        metrics: {
          teachingQuality: 93,
          studentFeedback: 90,
          administrativeEfficiency: 91,
          parentSatisfaction: 92
        }
      },
      { 
        month: "May", 
        attendance: 96, 
        performance: 91,
        metrics: {
          teachingQuality: 92,
          studentFeedback: 89,
          administrativeEfficiency: 92,
          parentSatisfaction: 91
        }
      },
      { 
        month: "Jun", 
        attendance: 94, 
        performance: 93,
        metrics: {
          teachingQuality: 94,
          studentFeedback: 91,
          administrativeEfficiency: 93,
          parentSatisfaction: 93
        }
      }
    ],
    staffQualifications: [
      { qualification: "PhD", count: 5, percentage: 10 },
      { qualification: "Masters", count: 20, percentage: 40 },
      { qualification: "Bachelors", count: 20, percentage: 40 },
      { qualification: "Diploma", count: 5, percentage: 10 }
    ],
    experienceDistribution: [
      { range: "0-2 years", count: 10, percentage: 20 },
      { range: "3-5 years", count: 15, percentage: 30 },
      { range: "6-10 years", count: 15, percentage: 30 },
      { range: "10+ years", count: 10, percentage: 20 }
    ],
    trainingMetrics: {
      completedTrainings: 45,
      upcomingTrainings: 5,
      trainingCategories: [
        { category: "Pedagogy", count: 15 },
        { category: "Technology", count: 12 },
        { category: "Management", count: 8 },
        { category: "Counseling", count: 5 },
        { category: "Other", count: 5 }
      ]
    }
  },
  financialHealth: {
    profitMargin: 28.5,
    cashFlow: [
      { month: "Jan", income: 1200000, expenses: 850000 },
      { month: "Feb", income: 1250000, expenses: 880000 },
      { month: "Mar", income: 1180000, expenses: 860000 },
      { month: "Apr", income: 1320000, expenses: 920000 },
      { month: "May", income: 1380000, expenses: 950000 },
      { month: "Jun", income: 1450000, expenses: 980000 }
    ],
    expenseCategories: [
      { category: "Salaries", amount: 450000 },
      { category: "Rent", amount: 120000 },
      { category: "Utilities", amount: 45000 },
      { category: "Marketing", amount: 75000 },
      { category: "Supplies", amount: 35000 },
      { category: "Other", amount: 25000 }
    ]
  },
  aiInsights: {
    overview: {
      positiveTrends: [
        "Lead conversion rate increased by 12.5% this month",
        "Revenue growth of 8.2% compared to last month",
        "Student enrollment up 15.3% year-over-year"
      ],
      areasForImprovement: [
        "Staff attendance declined by 2.1% - review attendance policies",
        "Website leads have lowest conversion rate - optimize landing pages",
        "Fee collection pending for ₹2.3L - implement automated reminders"
      ]
    },
    leads: {
      positiveTrends: [
        "Referral leads have the highest conversion rate (45%)",
        "Walk-in leads conversion improved by 10% this quarter"
      ],
      areasForImprovement: [
        "Google Ads leads conversion rate dropped by 5%",
        "Follow-up overdue for 12 hot leads"
      ]
    },
    revenue: {
      positiveTrends: [
        "Fee collection rate improved by 8% after online payment system",
        "Monthly revenue reached a new high in June"
      ],
      areasForImprovement: [
        "Pending fees increased in March - target reminders",
        "Books & Materials revenue declined by 3%"
      ]
    },
    students: {
      positiveTrends: [
        "Class 10 achieved 100% capacity utilization",
        "Science stream admissions up by 12%"
      ],
      areasForImprovement: [
        "Class 9 dropout risk 15% higher than average",
        "Arts stream enrollment below target"
      ]
    },
    staff: {
      positiveTrends: [
        "Staff training completion rate at 90%",
        "Teaching quality scores improved by 5%"
      ],
      areasForImprovement: [
        "Staff attendance rate dropped by 5% in Q2",
        "Support staff satisfaction below 80%"
      ]
    }
  }
};

export const mockNotifications = {
  unread: 5,
  notifications: [
    {
      id: 1,
      type: "admission",
      title: "New Admission Request",
      message: "Rahul Sharma has submitted an admission form for Class 9",
      timestamp: "2024-03-20T10:30:00Z",
      read: false,
      priority: "high",
      action: {
        type: "view_admission",
        id: "ADM-2024-001"
      }
    },
    {
      id: 2,
      type: "payment",
      title: "Fee Payment Received",
      message: "Payment of ₹45,000 received from Priya Patel for March 2024",
      timestamp: "2024-03-20T09:15:00Z",
      read: false,
      priority: "medium",
      action: {
        type: "view_payment",
        id: "PAY-2024-003"
      }
    },
    {
      id: 3,
      type: "attendance",
      title: "Low Attendance Alert",
      message: "Class 8B attendance below 75% for the week",
      timestamp: "2024-03-19T16:45:00Z",
      read: false,
      priority: "high",
      action: {
        type: "view_attendance",
        id: "ATT-2024-008"
      }
    },
    {
      id: 4,
      type: "exam",
      title: "Exam Results Published",
      message: "Mid-term exam results for Class 10 are now available",
      timestamp: "2024-03-19T14:20:00Z",
      read: false,
      priority: "medium",
      action: {
        type: "view_results",
        id: "EXAM-2024-002"
      }
    },
    {
      id: 5,
      type: "staff",
      title: "Staff Leave Request",
      message: "Anita Kumar has requested leave for March 25-26",
      timestamp: "2024-03-19T11:30:00Z",
      read: false,
      priority: "medium",
      action: {
        type: "view_leave",
        id: "LEAVE-2024-005"
      }
    },
    {
      id: 6,
      type: "maintenance",
      title: "Maintenance Required",
      message: "AC unit in Room 302 needs servicing",
      timestamp: "2024-03-18T15:45:00Z",
      read: true,
      priority: "low",
      action: {
        type: "view_maintenance",
        id: "MNT-2024-012"
      }
    },
    {
      id: 7,
      type: "event",
      title: "Upcoming Event",
      message: "Annual Sports Day scheduled for March 30",
      timestamp: "2024-03-18T10:00:00Z",
      read: true,
      priority: "medium",
      action: {
        type: "view_event",
        id: "EVT-2024-003"
      }
    },
    {
      id: 8,
      type: "parent",
      title: "Parent Meeting Request",
      message: "Mrs. Gupta requests a meeting regarding her son's performance",
      timestamp: "2024-03-17T16:30:00Z",
      read: true,
      priority: "high",
      action: {
        type: "schedule_meeting",
        id: "MTG-2024-008"
      }
    }
  ],
  categories: [
    { type: "admission", label: "Admissions", count: 1 },
    { type: "payment", label: "Payments", count: 1 },
    { type: "attendance", label: "Attendance", count: 1 },
    { type: "exam", label: "Exams", count: 1 },
    { type: "staff", label: "Staff", count: 1 },
    { type: "maintenance", label: "Maintenance", count: 1 },
    { type: "event", label: "Events", count: 1 },
    { type: "parent", label: "Parent Communication", count: 1 }
  ]
}; 