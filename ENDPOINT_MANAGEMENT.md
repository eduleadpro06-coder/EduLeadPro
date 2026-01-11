# API Endpoint & Base URL Management Guide

This document lists all locations in the codebase where API endpoints, base URLs, and domains are configured. If the server domain or base URL changes in the future, please refer to this checklist to ensure all components are updated.

## 📱 Mobile App (EduLeadPro-Mobile)

The mobile app relies heavily on environment variables and hardcoded constants for its backend communication.

### 1. Primary Configuration (Recommended)
These files are the main source of truth for the app's connectivity.
- **[constants.ts](file:///e:/WorkSpaceEduLeadPro/EduLeadPro/EduLeadPro-Mobile/src/utils/constants.ts)**: Contains `API_BASE_URL` and `WEBSOCKET_URL`. These are used by most services.
- **[.env.production](file:///e:/WorkSpaceEduLeadPro/EduLeadPro/EduLeadPro-Mobile/.env.production)** & **[.env.development](file:///e:/WorkSpaceEduLeadPro/EduLeadPro/EduLeadPro-Mobile/.env.development)**: Standard location for local development. Expo picks up `EXPO_PUBLIC_` variables automatically.
- **[eas.json](file:///e:/WorkSpaceEduLeadPro/EduLeadPro/EduLeadPro-Mobile/eas.json)**: Currently contains hardcoded environment variables for EAS Cloud builds.

### 2. Moving Variables to EAS Secrets (Best Practice)
To avoid hardcoding URLs and keys in `eas.json`, you can use **EAS Secrets**. This allows you to manage them via the Expo Dashboard or CLI.

#### How to move:
1. **Delete** the `env` block from a profile in `eas.json`.
2. **Add** the secret via terminal:
   ```bash
   eas secret:create --name EXPO_PUBLIC_API_URL --value https://eduleadconnect.vercel.app/api/v1/mobile --type string --scope project
   ```
3. Your **[app.config.js](file:///e:/WorkSpaceEduLeadPro/EduLeadPro/EduLeadPro-Mobile/app.config.js)** is already set up to read these:
   ```javascript
   extra: {
     apiUrl: process.env.EXPO_PUBLIC_API_URL,
     // ...
   }
   ```
   EAS will automatically inject these secrets into the build environment.

### 3. Secondary & Legacy Configuration
- **[config.ts](file:///e:/WorkSpaceEduLeadPro/EduLeadPro/EduLeadPro-Mobile/src/config.ts)**: Legacy configuration that pulls from `expo-constants`. It provides fallbacks for `localhost` if environment variables are missing.
- **[app.config.js](file:///e:/WorkSpaceEduLeadPro/EduLeadPro/EduLeadPro-Mobile/app.config.js)**: Maps environment variables to the Expo configuration object (`extra` field).

### 3. Hardcoded References (Sensitive Points)
These files contain hardcoded URLs that must be updated manually if the domain changes:
- **[logger.ts](file:///e:/WorkSpaceEduLeadPro/EduLeadPro/EduLeadPro-Mobile/src/services/logger.ts)**: Hardcoded `API_BASE_URL` for remote logging.
- **[OlaMapView.tsx](file:///e:/WorkSpaceEduLeadPro/EduLeadPro/EduLeadPro-Mobile/src/components/maps/OlaMapView.tsx)**: Hardcoded `baseUrl` in the `WebView` component (line 214) to satisfy Origin/CORS checks for map tiles.

---

## 💻 Web Admin Panel (client)

The web client is designed to be domain-agnostic by using relative URLs where possible.

- **[api.ts](file:///e:/WorkSpaceEduLeadPro/EduLeadPro/client/src/lib/api.ts)**: Uses a relative base path (`/api`), meaning it automatically uses the domain it's hosted on. No manual update needed for standard API calls.
- **[auth-utils.ts](file:///e:/WorkSpaceEduLeadPro/EduLeadPro/client/src/lib/auth-utils.ts)**: Dynamically calculates redirect URLs based on `window.location.origin`. No manual update needed.
- **[supabase.ts](file:///e:/WorkSpaceEduLeadPro/EduLeadPro/client/src/lib/supabase.ts)**: Uses environment variables (`VITE_SUPABASE_URL`) for Supabase connectivity.

---

## ⚙️ Backend Server (server)

- **[index.ts](file:///e:/WorkSpaceEduLeadPro/EduLeadPro/server/index.ts)**: Configures the server to listen on `0.0.0.0` and a configurable port (default `5000`).
- **[ollama-ai.ts](file:///e:/WorkSpaceEduLeadPro/EduLeadPro/server/ollama-ai.ts)**: Hardcoded `localhost:11434` for local AI services.

---

## 📝 Change Checklist
When changing the base URL (e.g., from `eduleadconnect.vercel.app` to a new domain):
1. [ ] Update `eas.json` profiles.
2. [ ] Update `.env.production`.
3. [ ] Update `src/utils/constants.ts`.
4. [ ] Update `src/services/logger.ts` (Mobile).
5. [ ] Update `src/components/maps/OlaMapView.tsx` (Mobile).
6. [ ] Rebuild the mobile app using `eas build`.
7. [ ] Verify Vercel environment variables for the Web Client/Server.
