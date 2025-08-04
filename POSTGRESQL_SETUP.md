# PostgreSQL Local Development Setup

This document explains the PostgreSQL configuration for your educational institution management system and how to set it up for local development.

## Current Configuration (Replit)

Your project is currently running on Replit with an integrated PostgreSQL database. The database connection is automatically configured through environment variables:

- `DATABASE_URL`: Complete PostgreSQL connection string
- `PGHOST`: Database host
- `PGPORT`: Database port (default: 5432)
- `PGUSER`: Database username
- `PGPASSWORD`: Database password
- `PGDATABASE`: Database name

## Database Schema

The system uses 13 interconnected tables:

### Core Tables
- **users**: Admin and counselor accounts
- **leads**: Student inquiries and prospects
- **students**: Enrolled students
- **lead_sources**: Marketing channels tracking

### Staff Management
- **staff**: Employee records
- **attendance**: Staff attendance tracking
- **payroll**: Salary and payment records

### Financial Management
- **expenses**: Institution expenses
- **fee_structure**: Fee plans by class/stream
- **fee_payments**: Student fee payments
- **e_mandate**: Auto-debit mandates
- **emi_schedule**: EMI payment schedules
- **follow_ups**: Lead follow-up activities

## Setting Up PostgreSQL Locally

### 1. Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS (using Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

### 2. Create Database and User

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE education_system;

# Create user
CREATE USER edu_admin WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE education_system TO edu_admin;

# Exit
\q
```

### 3. Configure Environment Variables

Create a `.env` file in your project root:

```env
DATABASE_URL=postgresql://edu_admin:your_secure_password@localhost:5432/education_system
PGHOST=localhost
PGPORT=5432
PGUSER=edu_admin
PGPASSWORD=your_secure_password
PGDATABASE=education_system
```

### 4. Run Database Migrations

```bash
# Install dependencies
npm install

# Push schema to database
npm run db:push
```

### 5. Start the Application

```bash
npm run dev
```

## Data Import

The system automatically imports your real CSV leads data on startup:
- 5 student leads from your provided CSV file
- Creates admin user (username: admin, password: admin123)
- No sample/mock data is included

## Database Management

### View Data
```bash
# Connect to your database
psql -h localhost -U edu_admin -d education_system

# List tables
\dt

# View leads
SELECT * FROM leads;

# View students
SELECT * FROM students;
```

### Backup Database
```bash
pg_dump -h localhost -U edu_admin education_system > backup.sql
```

### Restore Database
```bash
psql -h localhost -U edu_admin education_system < backup.sql
```

## Production Deployment

For production, consider:
1. **Managed PostgreSQL**: AWS RDS, Google Cloud SQL, or Azure Database
2. **Connection Pooling**: Use pgBouncer for better performance
3. **SSL/TLS**: Enable encrypted connections
4. **Regular Backups**: Automated daily backups
5. **Monitoring**: Set up database performance monitoring

## Security Best Practices

1. Use strong passwords for database users
2. Limit database user privileges to only required tables
3. Enable SSL connections in production
4. Regular security updates for PostgreSQL
5. Use environment variables for database credentials
6. Never commit database credentials to version control

## Troubleshooting

### Connection Issues
```bash
# Check PostgreSQL service
sudo systemctl status postgresql

# Restart service
sudo systemctl restart postgresql
```

### Permission Issues
```bash
# Reset user password
sudo -u postgres psql
ALTER USER edu_admin PASSWORD 'new_password';
```

### Port Conflicts
Check if port 5432 is in use:
```bash
sudo netstat -tlnp | grep 5432
```

## Support

Your system is configured with:
- Drizzle ORM for type-safe database operations
- Automatic schema synchronization
- Real CSV data import system
- Full PostgreSQL integration

The database is production-ready with proper indexing, foreign key constraints, and optimized queries for your educational institution management needs.