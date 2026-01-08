# EduConnect Mobile Web App - Deployment Guide

## 🚀 Quick Deploy (One Command)

```bash
cd EduLeadPro-Mobile
npm run deploy
```

This will:
1. Export the web build
2. Flatten font/asset folders
3. Copy vercel.json
4. Deploy to production

---

## 📋 Manual Deploy (Step by Step)

If you need to deploy manually:

```bash
# 1. Export web build
npx expo export --platform web

# 2. Flatten assets (fixes font 404 errors)
node scripts/flatten-assets.js

# 3. Copy Vercel config
Copy-Item vercel.json dist/vercel.json -Force

# 4. Deploy to Vercel
npx vercel dist --prod --yes --force
```

---

## 🔧 What Gets Fixed Automatically

### The Font Problem
Expo creates deeply nested paths like:
```
/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf
```

Our script flattens them to:
```
/assets/fonts/Feather.ttf
```

### What the flatten-assets.js Script Does:
- ✅ Finds all .ttf, .otf, .woff, .woff2 files
- ✅ Copies them to `/dist/assets/fonts/`
- ✅ Finds all .wasm files  
- ✅ Copies them to `/dist/assets/wasm/`
- ✅ Works with vercel.json rewrites

---

## 🌐 Live URLs

- **Main Admin Dashboard**: https://eduleadconnect.vercel.app
- **Mobile Web App**: https://eduleadapp.vercel.app

---

## 🐛 Troubleshooting

### "Fonts not loading" / Stuck on loading screen

**Solution 1: Hard refresh**
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

**Solution 2: Redeploy with cache bypass**
```bash
npm run deploy
```

**Solution 3: Check if fonts are flattened**
```bash
dir dist\assets\fonts
# Should show: AntDesign.ttf, Feather.ttf, etc.
```

### "404 errors in console"

Make sure:
1. `flatten-assets.js` ran successfully
2. `vercel.json` is in the `dist` folder
3. Fonts are in `/dist/assets/fonts/`

---

## 📦 What's in the Build

After running `npm run deploy`, you should have:

```
dist/
├── assets/
│   ├── fonts/          ← All fonts flattened here
│   ├── wasm/           ← WASM files flattened here
│   └── (other assets)
├── _expo/
├── index.html
├── favicon.ico
├── metadata.json
└── vercel.json         ← MUST be here!
```

---

## 🔄 Auto-Deploy with GitHub Actions

Every time you push code to GitHub, it will auto-deploy! 

The workflow is in: `.github/workflows/deploy-mobile-web.yml`

It runs automatically when:
- You push to `School-App-and-Meta-Marketing` or `main` branch
- Any files in `EduLeadPro-Mobile/` change

**To see deployment status:**
1. Go to GitHub repo
2. Click "Actions" tab
3. See the latest workflow run

---

## ⚙️ Environment Variables

The mobile app doesn't need environment variables because it proxies API calls through `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://eduleadconnect.vercel.app/api/:path*"
    }
  ]
}
```

All `/api/*` requests go to the main backend automatically!

---

## 📱 Testing Locally

To test the web build locally before deploying:

```bash
# Export
npx expo export --platform web

# Flatten
node scripts/flatten-assets.js

# Serve locally
npx serve dist

# Open: http://localhost:3000
```

---

## 💡 Pro Tips

1. **Always use `npm run deploy`** - Don't deploy dist folder without flattening!
2. **Check console first** - Before deploying, check browser console for errors
3. **Use --force flag** - Bypasses Vercel's cache: `npx vercel dist --prod --yes --force`
4. **Clear browser cache** - After deployment, do a hard refresh

---

## 🆘 Need Help?

Common issues and solutions:

| Issue | Solution |
|-------|----------|
| Fonts not loading | Run `node scripts/flatten-assets.js` |
| 404 on /api requests | Check vercel.json is in dist folder |
| Old version showing | Hard refresh browser (Ctrl+Shift+R) |
| React-native-maps error | Only happens on web, that's normal |

---

## 🎯 Permanent Fix Implemented

✅ **Problem**: Fonts break every time you rebuild  
✅ **Solution**: Auto-run flatten script after every export  
✅ **How**: Added `postexport:web` script in package.json

You no longer need to manually flatten assets - it happens automatically!

---

Last Updated: 2026-01-09
