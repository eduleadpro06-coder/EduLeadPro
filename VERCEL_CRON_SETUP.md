# Vercel Cron Job Setup Guide

This document explains the Vercel cron job configuration for EduLeadPro's automated daily tasks.

## Overview

The Vercel cron job runs daily to perform critical daycare management tasks:
- **Enrollment Expiration Checks**: Identifies enrollments expiring tomorrow or already expired
- **Overdue Follow-up Notifications**: Creates high-priority notifications for overdue follow-ups

## Schedule

**Cron Expression**: `30 3 * * *`  
**Execution Time**: 9:00 AM IST (3:30 AM UTC) daily  
**Timezone**: UTC (Vercel cron jobs run in UTC)

This aligns with the existing local cron job schedule.

## Environment Variable Setup

### CRON_SECRET

**Generated Secret**: `cron_secret_7a8f9d2e6b4c1a5f3e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6`

> [!IMPORTANT]
> You must add this environment variable to your Vercel project before the cron job will work.

### How to Add in Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **Add New**
4. Set:
   - **Key**: `CRON_SECRET`
   - **Value**: `cron_secret_7a8f9d2e6b4c1a5f3e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6`
   - **Environments**: Production, Preview, Development (select all)
5. Click **Save**
6. **Redeploy** your application for the changes to take effect

## Testing the Cron Job

### Local Testing (Development)

The endpoint works locally via Express route at `/api/cron`.

**Important:** After adding `CRON_SECRET` to `.env`, **restart your dev server** to load the new environment variable.

**PowerShell (Windows):**
```powershell
# Test with authorization
Invoke-WebRequest -Uri "http://localhost:5000/api/cron" -Headers @{"Authorization"="Bearer cron_secret_7a8f9d2e6b4c1a5f3e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6"} | Select-Object -ExpandProperty Content
```

### Manual Trigger (Vercel Dashboard)

1. Go to **Settings** → **Cron Jobs**
2. Find your cron job (`/api/cron`)
3. Click **Run Now** to manually trigger
4. Check the **Logs** tab to see execution results

### Local Testing

```bash
# Test without authorization (should return 401)
curl http://localhost:5000/api/cron

# Test with authorization (should return 200 with summary)
curl -H "Authorization: Bearer cron_secret_7a8f9d2e6b4c1a5f3e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6" http://localhost:5000/api/cron
```

## Response Format

### Success (200 OK)
```json
{
  "ok": true,
  "summary": {
    "enrollmentsExpiringTomorrow": 2,
    "expiredEnrollments": 1,
    "overdueFollowups": 3,
    "notificationsCreated": 6
  }
}
```

### Unauthorized (401)
```json
{
  "error": "Unauthorized"
}
```

### Error (500)
```json
{
  "error": "Internal server error",
  "message": "Error details here"
}
```

## Monitoring

### View Logs

1. Go to your Vercel project dashboard
2. Click on **Logs** in the top navigation
3. Filter by function: `api/cron/route`
4. Look for entries tagged with `[CRON]`

### Expected Log Output

```
[CRON] Starting daily daycare checks...
[CRON] Enrollment expiration check completed { expiring: 2, expired: 1, notifications: 3 }
[CRON] Overdue follow-ups check completed { count: 3 }
[CRON] Created 3 notifications for overdue follow-ups
[CRON] Summary: 2 enrollments expiring tomorrow, 1 expired enrollments, 3 overdue follow-ups
```

## Troubleshooting

### Cron job returns 401 Unauthorized
- Verify `CRON_SECRET` is set in Vercel environment variables
- Ensure you've redeployed after adding the environment variable
- Check that the secret matches exactly (no extra spaces)

### No notifications are created
- Check the daycare module to ensure there are enrollments or follow-ups
- Verify the database connection is working
- Check logs for any error messages

### Cron job doesn't run at scheduled time
- Verify the cron configuration in `vercel.json` is correct
- Check that the function is deployed successfully
- Note: There may be a few minutes variance in execution time

## Implementation Details

**Endpoint**: `/api/cron`  
**Method**: GET only  
**Authentication**: Bearer token (CRON_SECRET)  
**Timeout**: 30 seconds max  
**File**: `api/cron/route.ts`

The cron job reuses the same logic as the local cron job defined in `server/daycareCron.ts`, ensuring consistent behavior between local development and production.
