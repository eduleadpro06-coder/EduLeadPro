# Supabase Authentication Configuration for Production

## The Problem
When users click email confirmation links in production, they get redirected to `localhost:3000` with errors like:
```
http://localhost:3000/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired
```

## Root Cause
1. **Site URL misconfiguration** in Supabase dashboard
2. **Redirect URLs not properly configured** for production domain
3. **Email templates** still pointing to localhost

## Solution Steps

### 1. Configure Supabase Dashboard Settings

Go to your Supabase project dashboard: https://supabase.com/dashboard/project/fmmipkxamcopszteisce

#### A. Authentication Settings
1. Navigate to **Authentication** → **Settings**
2. Update the following settings:

**Site URL:**
```
https://your-production-domain.vercel.app
```
Replace `your-production-domain` with your actual Vercel app name.

**Additional Redirect URLs:**
Add these URLs (one per line):
```
https://your-production-domain.vercel.app/login
https://your-production-domain.vercel.app/dashboard
https://your-production-domain.vercel.app/auth/callback
http://localhost:3000/login
http://localhost:3000/dashboard
http://localhost:3000/auth/callback
```

#### B. Email Templates (CRITICAL)
1. Navigate to **Authentication** → **Email Templates**
2. For each template (Confirm signup, Magic Link, etc.):
   - Click **Edit**
   - Find any references to `localhost:3000`
   - Replace with `{{ .SiteURL }}`
   - This ensures emails use the correct domain

Example template fix:
```html
<!-- BEFORE (WRONG) -->
<a href="http://localhost:3000/auth/confirm?token={{ .Token }}">Confirm Email</a>

<!-- AFTER (CORRECT) -->
<a href="{{ .SiteURL }}/auth/confirm?token={{ .Token }}">Confirm Email</a>
```

### 2. Update Vercel Environment Variables

Add this new environment variable to your Vercel project:

```
VITE_PRODUCTION_URL=https://your-production-domain.vercel.app
```

**Steps:**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add `VITE_PRODUCTION_URL` with your production URL
5. Select all environments (Production, Preview, Development)
6. **REDEPLOY** your application

### 3. Test the Fix

1. **Deploy the updated code** to Vercel
2. **Sign up with a new email** on your production site
3. **Check the confirmation email** - the link should now point to your production domain
4. **Click the confirmation link** - it should redirect to your production login page
5. **Verify successful login**

### 4. Troubleshooting

If you still see localhost URLs:

1. **Clear Supabase email template cache:**
   - Go to Authentication → Email Templates
   - Re-save each template (even without changes)

2. **Check browser network tab:**
   - Look for the actual redirect URL being used
   - Verify environment variables are loaded correctly

3. **Test with incognito/private browsing:**
   - Eliminates caching issues

4. **Verify Vercel deployment:**
   - Check that the new environment variable is deployed
   - Redeploy if necessary

### 5. Additional Security (Optional)

For production, consider:

1. **Disable localhost redirects** in Supabase:
   - Remove `http://localhost:3000/*` from redirect URLs
   - Only keep production URLs

2. **Enable email rate limiting** in Supabase Authentication settings

3. **Set up custom SMTP** for better email deliverability

## Expected Behavior After Fix

✅ Email confirmation links point to production domain  
✅ Successful email confirmation redirects to production login  
✅ No more localhost redirect errors  
✅ Users can successfully confirm and login  

## Files Modified

- `client/src/lib/supabase.ts` - Updated redirect URL logic
- `client/src/contexts/AuthContext.tsx` - Fixed signup/resend redirects
- `client/src/pages/login.tsx` - Fixed password reset redirect
- `client/src/lib/auth-utils.ts` - New shared utility for redirect URLs
- `VERCEL_ENV_SETUP_FINAL.txt` - Added production URL variable

## Important Notes

- **Always test email flows in production** after making these changes
- **Keep localhost URLs for development** - the code handles environment detection
- **Redeploy after environment variable changes** - Vercel needs to rebuild with new vars
- **Email template changes take effect immediately** - no deployment needed