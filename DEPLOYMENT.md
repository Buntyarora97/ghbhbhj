# Haryana Ki Shan - Deployment Guide

## 1. Neon Database Setup (Already Done if using existing URL)

1. Go to https://neon.tech and sign up
2. Create a new project → copy the `DATABASE_URL`
3. Run the seed: `DATABASE_URL="your-neon-url" pnpm --filter @workspace/scripts run seed`
4. Your admin login: `admin@hks.com` / `admin123` (change after first login)

---

## 2. Backend on Render

1. Go to https://render.com → New Web Service
2. Connect your GitHub repo
3. **Settings:**
   - Build Command: `pnpm install && pnpm --filter @workspace/api-server run build`
   - Start Command: `node artifacts/api-server/dist/index.cjs`
   - Environment: **Node**
4. **Environment Variables (add all of these):**
   ```
   DATABASE_URL = your-neon-postgresql-url
   JWT_SECRET   = haryana-ki-shan-secret-2024
   ADMIN_JWT_SECRET = haryana-ki-shan-admin-secret-2024
   NODE_ENV     = production
   PORT         = 10000
   ```
5. Deploy → Copy your Render URL (e.g. `https://your-app.onrender.com`)

---

## 3. Admin Panel on Hostinger

### Step 1: Build the admin panel
Run this command in terminal:
```bash
cd artifacts/admin
VITE_API_BASE_URL=https://your-render-url.onrender.com pnpm run build
```

This creates a `dist/` folder inside `artifacts/admin/`.

### Step 2: Upload to Hostinger
1. Login to Hostinger → File Manager
2. Go to `public_html/` (or create subfolder like `admin/`)
3. Upload ALL files from `artifacts/admin/dist/` to `public_html/`
4. Make sure `index.html` is in the root of `public_html/`

### Step 3: Fix routing (important!)
Create a file `.htaccess` in `public_html/` with this content:
```
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

### Step 4: Access your admin panel
Go to: `https://your-domain.com` → Login with `admin@hks.com` / `admin123`

---

## 4. Mobile App APK Build (Expo EAS)

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```

### Step 3: Configure EAS (one time)
```bash
cd artifacts/mobile
eas build:configure
```

### Step 4: Update API URL
In `artifacts/mobile/lib/api.ts`, change `BASE_URL` to your Render backend URL:
```typescript
const BASE_URL = "https://your-render-url.onrender.com/api";
```

### Step 5: Build APK
```bash
cd artifacts/mobile
eas build --platform android --profile preview
```

When prompted:
- Select: **APK** (not AAB) for direct install
- Wait 5-10 minutes for build to complete
- Download the APK from the link provided

### For testing without EAS (local build):
```bash
cd artifacts/mobile
npx expo run:android
```
(Requires Android Studio + emulator installed)

---

## Admin Panel Credentials
- Email: `admin@hks.com`
- Password: `admin123`
- **Super Admin** has full control — can create/delete sub-admins

## Game Rules (configured in DB)
- Jodi: 2-digit number (00-99) — Win 90x
- Haruf: Single digit (0-9) — Win 9x
- Min deposit: ₹50
- Min bet: ₹10
