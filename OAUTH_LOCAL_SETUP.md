# OAuth Local Development Setup

## Issue
Google OAuth redirects to production URL instead of localhost during development.

## Solution
The authentication configuration has been updated to dynamically detect the environment and use the appropriate redirect URL.

### Code Changes Made:
1. Updated `client/src/lib/supabase.ts` - Fixed redirect URL detection
2. Updated `client/src/lib/auth-utils.ts` - Improved environment detection  
3. Updated `client/src/components/layout/sidebar.tsx` - Added AI Enhanced Hub navigation

### Supabase Configuration Required:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/fmmipkxamcopszteisce)
2. Navigate to **Authentication > URL Configuration**
3. Add these redirect URLs:
   - `http://localhost:5000/auth/callback` (for local development)
   - Your production domain callback URL

4. In **Authentication > Providers > Google**:
   - Ensure Google OAuth is enabled
   - Add both `localhost:5000` and your production domain to authorized domains

### Testing:
- Local development: `http://localhost:5000`
- AI Enhanced Dashboard: `http://localhost:5000/ai-enhanced`
- After configuring Supabase, Google OAuth should work locally

### New AI Features Added:
- ✅ Advanced lead scoring with urgency levels
- ✅ Smart communication automation
- ✅ Financial analytics and forecasting
- ✅ Real-time AI insights dashboard
- ✅ Multi-channel communication planning
- ✅ Risk analysis and prevention

The system now automatically detects whether you're on localhost or production and uses the correct redirect URL accordingly.