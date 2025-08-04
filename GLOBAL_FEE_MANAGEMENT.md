# Global Class Fee Management

## Overview

The Global Class Fee Management system allows you to set and manage fee structures for different classes that can be used for calculations and automatically assigned to students. This feature provides a centralized way to manage fees across all classes and academic years.

## Features

### 1. Global Fee Configuration
- Set fee structures for different classes (Class 1-12)
- Configure multiple fee types (tuition, admission, library, laboratory, etc.)
- Set different frequencies (monthly, quarterly, yearly, one-time)
- Manage fees by academic year
- Enable/disable fee structures

### 2. Fee Types Supported
- **Tuition Fee**: Regular monthly/quarterly/yearly fees
- **Admission Fee**: One-time admission charges
- **Library Fee**: Annual library access fees
- **Laboratory Fee**: Science lab usage fees
- **Sports Fee**: Sports facility and equipment fees
- **Transport Fee**: Transportation service fees
- **Examination Fee**: Exam-related charges
- **Development Fee**: Infrastructure development fees
- **Other**: Custom fee types

### 3. Frequency Options
- **Monthly**: Recurring monthly payments
- **Quarterly**: Recurring quarterly payments
- **Yearly**: Recurring annual payments
- **One-time**: Single payment fees

## Database Schema

### Global Class Fees Table
```sql
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
```

## API Endpoints

### GET /api/global-class-fees
- Fetch all global class fees
- Query parameter: `className` (optional) to filter by class

### GET /api/global-class-fees/:id
- Fetch a specific global class fee by ID

### POST /api/global-class-fees
- Create a new global class fee
- Required fields: `className`, `feeType`, `amount`, `frequency`, `academicYear`
- Optional fields: `description`, `isActive`

### PUT /api/global-class-fees/:id
- Update an existing global class fee

### DELETE /api/global-class-fees/:id
- Delete a global class fee

## Usage

### 1. Setting Up Global Fees
1. Navigate to the "Student Fees" page
2. Click on the "Global Fees" tab
3. Click "Add Global Fee" button
4. Fill in the required information:
   - Select the class
   - Choose fee type
   - Enter amount
   - Select frequency
   - Choose academic year
   - Set status (active/inactive)
   - Add optional description
5. Click "Create Fee"

### 2. Managing Global Fees
- **View**: See all configured fees in a table format
- **Edit**: Click the "Edit" button to modify existing fees
- **Filter**: Filter fees by academic year
- **View Total**: Click "View Total" to see the total fees for a class
- **Status**: Toggle between active and inactive status

### 3. Fee Calculations
The system provides utility functions to:
- Calculate total fees for a class
- Get fee breakdown by type
- Apply global fees to individual students

### 4. Integration with Student Management
Global fees can be used to:
- Automatically calculate student fee structures
- Generate fee reports
- Track fee collections
- Manage EMI schedules

## Benefits

1. **Centralized Management**: All class fees managed in one place
2. **Consistency**: Ensures uniform fee structures across classes
3. **Flexibility**: Easy to modify fees for different academic years
4. **Automation**: Can automatically apply fees to new students
5. **Reporting**: Better insights into fee structures and collections
6. **Scalability**: Easy to add new classes and fee types

## Migration

To set up the global fee management system:

1. Run the migration script:
   ```bash
   psql -d your_database -f scripts/migrate-global-fees.sql
   ```

2. The script will:
   - Create the `global_class_fees` table
   - Add necessary indexes for performance
   - Insert sample data for testing
   - Set up triggers for automatic timestamp updates

## Sample Data

The migration script includes sample data for:
- Class 10: Tuition (₹5,000/month), Admission (₹15,000), Library (₹500/year)
- Class 11: Tuition (₹6,000/month), Admission (₹18,000), Laboratory (₹2,000/year)
- Class 12: Tuition (₹7,000/month), Admission (₹20,000), Examination (₹3,000/year)

## Future Enhancements

1. **Bulk Operations**: Import/export fee structures
2. **Fee Templates**: Predefined fee structure templates
3. **Fee History**: Track changes to fee structures over time
4. **Advanced Calculations**: Support for discounts, scholarships, and late fees
5. **Integration**: Connect with payment gateways and accounting systems
6. **Notifications**: Automated alerts for fee due dates and changes 