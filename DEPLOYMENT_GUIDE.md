# Haryana Ki Shan — Complete Deployment Guide

## Overview

| Service | Platform | Status |
|---------|----------|--------|
| Backend API | Render | Deploy from GitHub |
| Database | Neon PostgreSQL | Create & connect |
| Admin Panel | Hostinger | Upload dist folder |
| Mobile App | Expo EAS | Build APK |

---

## Step 1: Neon Database Setup

1. Go to [neon.tech](https://neon.tech) → Create free account
2. **New Project** → Name: `haryana-ki-shan`
3. After creation, copy the **Connection String** (looks like `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`)
4. **Push schema to Neon** (run in Replit terminal):
   ```bash
   DATABASE_URL="your-neon-connection-string" pnpm --filter @workspace/db run push
   ```

---

## Step 2: Render Backend Deploy

1. Go to [render.com](https://render.com) → New Web Service
2. Connect your GitHub repo (push this project to GitHub first)
3. Render will auto-detect `render.yaml` — click **Apply**
4. Go to **Environment** tab on Render and add:
   - `DATABASE_URL` = your Neon connection string
   - `JWT_SECRET` = any strong secret string
   - `ADMIN_JWT_SECRET` = any strong secret string
5. Click **Deploy** — your API will be at `https://haryana-my-love-2jd4.onrender.com`

> The mobile app is already configured with this Render URL.

---

## Step 3: Admin Panel Build for Hostinger

Run this command in Replit terminal to build the admin panel:

```bash
BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/admin run build
```

The built files will be in: `artifacts/admin/dist/public/`

**Upload to Hostinger:**
1. Login to Hostinger → File Manager
2. Go to `public_html/` folder
3. Upload ALL contents of `artifacts/admin/dist/public/` to `public_html/`
4. Done! Admin panel will be live on your Hostinger domain.

> **Note:** Admin panel talks to Render API. Make sure your admin code has the correct API URL.

---

## Step 4: APK Build with Expo EAS

1. Install EAS CLI (if not installed):
   ```bash
   npm install -g eas-cli
   ```

2. Login to Expo:
   ```bash
   eas login
   ```

3. Go to mobile folder and build APK:
   ```bash
   cd artifacts/mobile
   eas build --platform android --profile production
   ```

4. Download APK from Expo dashboard: [expo.dev](https://expo.dev) → Your Project → Builds

> The APK will connect to Render backend automatically (URL is already set in `artifacts/mobile/lib/api.ts`)

---

## Environment Variables Summary

### Render (Backend)
| Key | Value |
|-----|-------|
| `DATABASE_URL` | Neon connection string |
| `JWT_SECRET` | Strong secret (e.g., 32+ random chars) |
| `ADMIN_JWT_SECRET` | Strong secret (e.g., 32+ random chars) |
| `NODE_ENV` | `production` |

### Replit (Development)
Add these in Replit Secrets tab:
- `DATABASE_URL` — your Neon connection string

---

## Quick Commands Reference

```bash
# Install all packages
pnpm install

# Push DB schema to Neon
DATABASE_URL="..." pnpm --filter @workspace/db run push

# Build admin for Hostinger
BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/admin run build

# Build APK
cd artifacts/mobile && eas build --platform android --profile production

# Run locally on Replit
pnpm run dev
```
