# Vercel Environment Variables Setup

## Required Environment Variables for Vercel

Copy and paste these environment variables into your Vercel project settings:

### 1. Supabase Configuration (Client-side)
```
VITE_SUPABASE_URL=https://fmmipkxamcopszteisce.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtbWlwa3hhbWNvcHN6dGVpc2NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTIzOTUsImV4cCI6MjA2OTg2ODM5NX0.LK2LlzykKgE3Q3pdXJZyg8JjfsRTTMRPayHkmV-dS7U
```

### 2. Supabase Configuration (Server-side)
```
SUPABASE_URL=https://fmmipkxamcopszteisce.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtbWlwa3hhbWNvcHN6dGVpc2NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTIzOTUsImV4cCI6MjA2OTg2ODM5NX0.LK2LlzykKgE3Q3pdXJZyg8JjfsRTTMRPayHkmV-dS7U
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtbWlwa3hhbWNvcHN6dGVpc2NlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI5MjM5NSwiZXhwIjoyMDY5ODY4Mzk1fQ._1Qhl4moQYRTmioaX_xg438ZxoimuvEO8Yck4g7UCME
SUPABASE_JWT_SECRET=07leB+ps17a6LPF62GCf9hiZPf7CopXCVuyfCozh8TMb9aCTS1BwvO1mDiM1WwQ4y17TVYvVg6xLir3kKaiZ3w==
```

### 3. Database Configuration
```
DATABASE_URL=postgres://postgres.fmmipkxamcopszteisce:bmfPzU4DLMLlmK8N@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require
POSTGRES_URL=postgres://postgres.fmmipkxamcopszteisce:bmfPzU4DLMLlmK8N@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
POSTGRES_PRISMA_URL=postgres://postgres.fmmipkxamcopszteisce:bmfPzU4DLMLlmK8N@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
POSTGRES_URL_NON_POOLING=postgres://postgres.fmmipkxamcopszteisce:bmfPzU4DLMLlmK8N@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require
POSTGRES_USER=postgres
POSTGRES_HOST=db.fmmipkxamcopszteisce.supabase.co
POSTGRES_PASSWORD=bmfPzU4DLMLlmK8N
POSTGRES_DATABASE=postgres
```

### 4. Server Configuration
```
NODE_ENV=production
SESSION_SECRET=your-secure-session-secret-key-change-this
JWT_SECRET=07leB+ps17a6LPF62GCf9hiZPf7CopXCVuyfCozh8TMb9aCTS1BwvO1mDiM1WwQ4y17TVYvVg6xLir3kKaiZ3w==
```

### 5. Optional: Debug Mode (for troubleshooting)
```
VITE_ENABLE_DEBUG=true
```

## How to Set These in Vercel:

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click on "Settings" tab
4. Select "Environment Variables" from the left sidebar
5. For each variable above:
   - Enter the name (e.g., `VITE_SUPABASE_URL`)
   - Enter the value (e.g., `https://fmmipkxamcopszteisce.supabase.co`)
   - Select "Production", "Preview", and "Development" environments
   - Click "Add"
6. After adding all variables, redeploy your application

## Important Notes:

- **VITE_** prefixed variables are for client-side (React app)
- Variables without **VITE_** prefix are for server-side
- Make sure to select all environments (Production, Preview, Development) for each variable
- After setting all variables, you MUST redeploy your application for changes to take effect

## Testing After Deployment:

1. Visit your deployed app
2. Look for the environment info icon (ℹ️) in the bottom right corner
3. If you see a warning icon (⚠️), there's still a configuration issue
4. Try to sign up with a test email to verify authentication is working

## Troubleshooting:

If authentication still doesn't work after setting these variables:
1. Check the browser console for errors
2. Verify all environment variables are set correctly in Vercel
3. Make sure you've redeployed after setting the variables
4. Check that your Supabase project is active and accessible