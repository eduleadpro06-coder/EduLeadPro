# Complete Deployment Guide for EduLeadPro

## Step 1: Set Environment Variables in Vercel

Go to your Vercel dashboard and set these environment variables:

### Required for Authentication (CRITICAL)
```
VITE_SUPABASE_URL=https://fmmipkxamcopszteisce.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtbWlwa3hhbWNvcHN6dGVpc2NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTIzOTUsImV4cCI6MjA2OTg2ODM5NX0.LK2LlzykKgE3Q3pdXJZyg8JjfsRTTMRPayHkmV-dS7U
```

### Server-side Configuration
```
SUPABASE_URL=https://fmmipkxamcopszteisce.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtbWlwa3hhbWNvcHN6dGVpc2NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyOTIzOTUsImV4cCI6MjA2OTg2ODM5NX0.LK2LlzykKgE3Q3pdXJZyg8JjfsRTTMRPayHkmV-dS7U
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtbWlwa3hhbWNvcHN6dGVpc2NlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI5MjM5NSwiZXhwIjoyMDY5ODY4Mzk1fQ._1Qhl4moQYRTmioaX_xg438ZxoimuvEO8Yck4g7UCME
SUPABASE_JWT_SECRET=07leB+ps17a6LPF62GCf9hiZPf7CopXCVuyfCozh8TMb9aCTS1BwvO1mDiM1WwQ4y17TVYvVg6xLir3kKaiZ3w==
```

### Database Configuration
```
DATABASE_URL=postgres://postgres.fmmipkxamcopszteisce:bmfPzU4DLMLlmK8N@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require
POSTGRES_URL=postgres://postgres.fmmipkxamcopszteisce:bmfPzU4DLMLlmK8N@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x
POSTGRES_PRISMA_URL=postgres://postgres.fmmipkxamcopszteisce:bmfPzU4DLMLlmK8N@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
POSTGRES_URL_NON_POOLING=postgres://postgres.fmmipkxamcopszteisce:bmfPzU4DLMLlmK8N@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require
```

### Production Configuration
```
NODE_ENV=production
SESSION_SECRET=your-secure-production-session-secret-key
JWT_SECRET=07leB+ps17a6LPF62GCf9hiZPf7CopXCVuyfCozh8TMb9aCTS1BwvO1mDiM1WwQ4y17TVYvVg6xLir3kKaiZ3w==
```

### Optional: Debug Mode (for troubleshooting)
```
VITE_ENABLE_DEBUG=true
```

## Step 2: Verify Supabase Project Settings

1. Go to https://app.supabase.io/
2. Select your project: `fmmipkxamcopszteisce`
3. Go to **Authentication** > **Settings**
4. Make sure these settings are configured:

### Email Settings
- **Enable email confirmations**: Should be enabled if you want email verification
- **Confirm email**: Set to your preference (recommended: enabled)
- **Enable email change confirmations**: Recommended: enabled

### Site URL Settings
- **Site URL**: Add your Vercel domain (e.g., `https://your-app.vercel.app`)
- **Redirect URLs**: Add:
  - `https://your-app.vercel.app/login`
  - `https://your-app.vercel.app/dashboard`
  - `http://localhost:5000/login` (for local development)
  - `http://localhost:5000/dashboard` (for local development)

### Auth Providers
- **Email**: Should be enabled
- **Other providers**: Configure as needed

## Step 3: Deploy to Vercel

1. Commit all your changes:
```bash
git add .
git commit -m "Fix authentication configuration"
git push
```

2. If auto-deployment is enabled, Vercel will automatically deploy
3. If not, go to Vercel dashboard and trigger a manual deployment

## Step 4: Test Your Deployment

After deployment:

1. **Visit your deployed app**
2. **Look for the debug icon** (ℹ️ or ⚠️) in the bottom right corner
3. **Click it to check environment variables**
4. **Try to sign up** with a test email
5. **Check your email** for confirmation
6. **Try to sign in** after confirming

## Step 5: Troubleshooting

### If you see a black screen:
- Check browser console for errors
- Verify all environment variables are set in Vercel
- Make sure you've redeployed after setting variables

### If authentication doesn't work:
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set correctly
- Verify your Supabase project is active
- Check Supabase Auth settings (Site URL, Redirect URLs)
- Look at the browser network tab for failed requests

### If you see "placeholder.supabase.co" errors:
- Environment variables are not set correctly in Vercel
- Make sure to select all environments (Production, Preview, Development) when setting variables
- Redeploy after setting variables

### Common Issues:
1. **Environment variables not taking effect**: Redeploy after setting them
2. **Email confirmation not working**: Check Supabase email settings
3. **Redirect issues**: Verify Site URL and Redirect URLs in Supabase
4. **CORS errors**: Make sure your domain is added to Supabase settings

## Step 6: Production Checklist

Before going live:
- [ ] All environment variables set in Vercel
- [ ] Supabase Site URL configured with your domain
- [ ] Email confirmation working
- [ ] Sign up and sign in working
- [ ] Database connections working
- [ ] No console errors
- [ ] Debug mode disabled (remove `VITE_ENABLE_DEBUG`)

## Support

If you're still having issues:
1. Check the browser console for errors
2. Use the debug component to verify environment variables
3. Test authentication with the test HTML file
4. Check Supabase logs in the dashboard