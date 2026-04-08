# Haryana Ki Shan — Complete Deployment Guide

## Overview

| Service | Platform |
|---------|----------|
| Backend API | Render |
| Database | Neon PostgreSQL |
| Admin Panel | Hostinger |
| Mobile App | Expo EAS (APK) |

---

## ✅ Admin Login Credentials
```
Username (Email): Narendersoni@haryana
Password:         Narender@#000#@
```

---

## Step 1: Neon Database ✅ (DONE)

Database tables aur admin user already ban chuke hain.
Neon URL:
```
postgresql://neondb_owner:npg_DXU0xRVYWEs1@ep-wispy-field-am8qvn2f-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

---

## Step 2: Render Backend Deploy

1. Code GitHub pe push karo (Replit Git → Push)
2. [render.com](https://render.com) → New Web Service → GitHub repo select karo
3. Render `render.yaml` auto detect karega → Apply dabao
4. **Environment** tab mein ye EXACT values daalo:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `postgresql://neondb_owner:npg_DXU0xRVYWEs1@ep-wispy-field-am8qvn2f-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | `haryana-ki-shan-secret-2024` |
| `ADMIN_JWT_SECRET` | `haryana-ki-shan-admin-secret-2024` |

> ⚠️ JWT_SECRET bilkul same hona chahiye — password isi se hash hota hai

---

## Step 3: Hostinger Admin Panel

Replit Shell mein run karo:
```bash
BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/admin run build
```
Files milenge: `artifacts/admin/dist/public/`

Hostinger pe:
1. File Manager kholo → `public_html/` folder
2. `artifacts/admin/dist/public/` ka poora content upload karo

---

## Step 4: APK Build (Expo EAS)

Replit Shell mein:
```bash
cd artifacts/mobile
npx eas-cli login
npx eas-cli build --platform android --profile production
```
APK [expo.dev](https://expo.dev) → Builds mein milegi

---

## Quick Reference Commands

```bash
# Admin panel build for Hostinger
BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/admin run build

# Database push to Neon (if schema changes)
DATABASE_URL="neon-url-here" pnpm --filter @workspace/db run push
```
