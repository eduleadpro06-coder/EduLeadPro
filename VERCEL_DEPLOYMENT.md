# Vercel Deployment Guide for EduLeadPro

This guide will help you deploy your EduLeadPro application to Vercel.

## 🚨 Current Issue Fixed

The problem where your app was showing JavaScript code instead of the React UI has been resolved by:

1. **Removing Replit plugins** from `vite.config.ts` for production builds
2. **Fixing Vercel configuration** to properly serve static files
3. **Updating build scripts** to work with Vercel's build process

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub/GitLab/Bitbucket**: Your code should be in a Git repository
3. **Environment Variables**: Prepare your production environment variables

## Environment Variables Setup

Before deploying, you need to set up the following environment variables in Vercel:

### Required Environment Variables

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Database Configuration
DATABASE_URL=your_production_database_url

# Server Configuration
NODE_ENV=production

# AI Configuration
OPENAI_API_KEY=your_openai_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key

# Email Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@eduleadpro.com

# Session Configuration
SESSION_SECRET=your_secure_session_secret_key

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_key
```

## Deployment Steps

### 1. Install Vercel CLI (Optional)

```bash
npm i -g vercel
```

### 2. Deploy via Vercel Dashboard

1. **Connect Repository**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository

2. **Configure Project**:
   - **Framework Preset**: Select "Other"
   - **Root Directory**: Leave as `/` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Environment Variables**:
   - Add all the environment variables listed above
   - Make sure to use production values

4. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete

### 3. Deploy via CLI (Alternative)

```bash
# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? [Select your account]
# - Link to existing project? N
# - What's your project's name? eduleadpro
# - In which directory is your code located? ./
# - Want to override the settings? N
```

## Configuration Files

The following files have been created for Vercel deployment:

### `vercel.json`
- Configures the build process
- Sets up routing for API and static files
- Defines serverless function settings

### `api/index.ts`
- Serverless function entry point for API routes
- Handles all `/api/*` requests

### `api/test.ts`
- Health check endpoint for testing API functionality

### `.vercelignore`
- Excludes unnecessary files from deployment
- Reduces build time and bundle size

## Post-Deployment

### 1. Verify Deployment
- Check that your app is accessible at the provided URL
- Test API endpoints at `your-domain.vercel.app/api/*`
- Test the health check endpoint: `your-domain.vercel.app/api/test`
- Verify that the frontend loads correctly (should show React UI, not JavaScript code)

### 2. Custom Domain (Optional)
- Go to your project settings in Vercel
- Add your custom domain
- Configure DNS records as instructed

### 3. Environment Variables
- Verify all environment variables are set correctly
- Test functionality that depends on external services

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are in `package.json`
   - Verify TypeScript compilation
   - Remove Replit-specific plugins from vite.config.ts for production builds

2. **Showing JavaScript Code Instead of UI**:
   - This happens when Vercel serves the JS bundle instead of the HTML file
   - Ensure proper routing configuration in vercel.json
   - Check that the build generates index.html in dist
   - Verify that all static assets are properly referenced

3. **API Errors**:
   - Check environment variables are set
   - Verify database connection
   - Check serverless function logs

4. **Static File Issues**:
   - Ensure build output is in `dist`
   - Check Vite configuration
   - Verify file paths in components

### Debugging

1. **Local Testing**:
   ```bash
   npm run build
   npm start
   ```

2. **Vercel Logs**:
   - Use Vercel CLI: `vercel logs`
   - Check dashboard for function logs

3. **Environment Variables**:
   - Verify in Vercel dashboard
   - Check for typos in variable names

## Performance Optimization

1. **Image Optimization**:
   - Use Vercel's image optimization
   - Optimize images before upload

2. **Caching**:
   - Configure appropriate cache headers
   - Use CDN for static assets

3. **Bundle Size**:
   - Monitor bundle size in build logs
   - Use code splitting where appropriate

## Security Considerations

1. **Environment Variables**:
   - Never commit `.env` files
   - Use Vercel's environment variable system
   - Rotate secrets regularly

2. **CORS**:
   - Configure CORS for your domain
   - Restrict API access as needed

3. **Rate Limiting**:
   - Implement rate limiting for API endpoints
   - Monitor usage patterns

## Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions) 