# Database Cleanup and CSV Import Guide

## Overview

This guide explains how to safely remove all testing data from the database and import new leads from a CSV file.

## ⚠️ CRITICAL WARNING

**The database cleanup script will DELETE ALL DATA from every table in your database.**

- **ALL records will be permanently removed** (users, organizations, leads, students, staff, etc.)
- Only the database schema (table structures) will remain
- This operation is **IRREVERSIBLE**
- Make sure you have a backup of any important data before proceeding

## Step 1: Database Cleanup

### Running the Cleanup Script

1. **Locate the cleanup script:**
   ```
   migrations/clear_all_data.sql
   ```

2. **Review the script** to understand what will be deleted

3. **Execute the script safely:**
   
   The script is designed with safety in mind:
   - Runs in a transaction (can be rolled back)
   - Shows counts before and after deletion
   - Verifies all data was deleted successfully
   - **IMPORTANT:** The script ends with `ROLLBACK` by default

4. **To actually execute the deletion:**
   
   Open `migrations/clear_all_data.sql` and:
   - Comment out the `ROLLBACK;` line at the end
   - Uncomment the `COMMIT;` line
   - Run the script in your database client

   ```sql
   -- At the end of the file, change from:
   ROLLBACK;
   
   -- To:
   -- ROLLBACK;
   COMMIT;
   ```

### Verification

After running the script, you should see:

```
========================================
DATA DELETION COMPLETED
========================================
Remaining records (should all be 0):
  Users: 0
  Organizations: 0
  Leads: 0
  Students: 0
  Staff: 0
  Daycare Children: 0
  Notifications: 0
  Fee Payments: 0
========================================
SUCCESS: All data has been deleted!
Database schema remains intact.
========================================
```

## Step 2: CSV Import

### CSV File Format

Your CSV file should contain lead information with the following columns (column names are flexible):

**Required columns:**
- Name (student name)
- Phone (parent/student phone)
- Class (e.g., "Class 10", "Class 11", "Class 12")

**Optional columns:**
- Email
- Stream (e.g., "Science", "Commerce", "Arts")
- Source (e.g., "Facebook", "Google Ads", "Referral")
- Parent Name
- Parent Phone (if different from main phone)
- Address
- Notes
- Interested Program

### Example CSV Format

```csv
Name,Phone,Email,Class,Stream,Source,Parent Name,Address
John Doe,9876543210,john@example.com,Class 11,Science,Facebook,Jane Doe,123 Main St
Mary Smith,8765432109,mary@example.com,Class 10,Commerce,Google Ads,Robert Smith,456 Oak Ave
```

### Auto-Detection

The import system will automatically detect column mappings based on common variations:

- **Name:** "name", "student name", "student_name", "fullname"
- **Phone:** "phone", "mobile", "contact", "phone number"
- **Email:** "email", "email address", "e-mail"
- **Class:** "class", "grade", "standard"
- **Stream:** "stream", "branch", "specialization"
- **Source:** "source", "lead source"
- **Parent Name:** "parent name", "parent_name", "father name", "guardian"
- **Address:** "address", "location", "city"
- **Notes:** "notes", "remarks", "comments"

### Using the API Endpoint

The CSV import is available via the API endpoint:

**Endpoint:** `POST /api/leads/import-csv`

**Request Body:**
```json
{
  "csvData": "Name,Phone,Class\nJohn Doe,9876543210,Class 11\n...",
  "columnMapping": {           // Optional - auto-detects if not provided
    "name": "Name",
    "phone": "Phone",
    "class": "Class",
    "stream": "Stream",
    "source": "Source"
  },
  "defaultSource": "csv_import"  // Optional - defaults to "csv_import"
}
```

**Response:**
```json
{
  "message": "Import completed: 45 successful, 2 failed, 3 duplicates",
  "success": true,
  "totalRows": 50,
  "successfulImports": 45,
  "failedImports": 2,
  "duplicates": 3,
  "errors": [
    {
      "row": 12,
      "data": { ... },
      "error": "phone: Phone number must contain exactly 10 digits"
    }
  ],
  "columnMapping": { ... }
}
```

### Validation Rules

All imported leads are validated against the following rules:

- **Name:** Required, non-empty string
- **Phone:** Required, exactly 10 digits (can include spaces, hyphens, parentheses)
- **Email:** Optional, must be valid email format if provided
- **Class:** Required, non-empty string
- **Stream:** Optional string
- **Source:** Defaults to "csv_import" if not provided

### Duplicate Detection

The import system checks for duplicates based on phone numbers within your organization. If a duplicate is found, that row will be skipped and reported in the response.

## Step 3: Verification

After importing your CSV:

1. **Check the import response** for any errors or failed imports
2. **Visit the Lead Management page** to verify leads were imported correctly
3. **Review the error details** if any imports failed
4. **Fix any issues** in your CSV and re-import if needed

## Troubleshooting

### Import Fails: "Could not auto-detect required columns"

**Solution:** Provide a manual column mapping in your request:

```json
{
  "csvData": "...",
  "columnMapping": {
    "name": 0,        // Use column index (0-based) if names don't match
    "phone": 1,
    "class": 2
  }
}
```

### Import Fails: Validation Errors

**Common issues:**
- Phone numbers not exactly 10 digits
- Invalid email format
- Missing required fields (name, phone, class)

**Solution:** Clean up your CSV data to match the validation rules

### Duplicates Detected

**Behavior:** Duplicate phone numbers (within the same organization) are automatically skipped

**Solution:** 
- Review the duplicate details in the response
- Decide whether to update existing leads or skip duplicates

## Notes

- The import process is **organization-aware** - you must be logged in and have an organization assigned
- All imported leads are assigned to your organization automatically
- Import is processed in batches for large files
- The system handles various CSV formats (comma, tab-delimited)
- UTF-8 encoding with BOM is supported
