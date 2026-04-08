# Haryana Ki Shan - Payment System

Full-stack Satta Matka platform with admin panel, mobile app, and API backend.

---

## Project Overview

| Component | Tech | Port |
|-----------|------|------|
| Admin Panel | React + Vite | 5000 |
| API Backend | Node.js + Express | 8080 |
| Database | Neon PostgreSQL | — |
| Mobile App | React Native + Expo | — |

---

## Database (Neon PostgreSQL)

Connection string is in `.env`:

```
DATABASE_URL=postgresql://neondb_owner:npg_binRov64QBNM@ep-soft-scene-a4b8c8kv-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Tables Created
- `users` — app users with wallet balance, referral code
- `admins` — admin accounts
- `markets` — betting markets (Haryana Morning, Day, etc.)
- `bets` — user bets
- `results` — market results
- `transactions` — wallet transaction history
- `deposit_requests` — user deposit requests
- `withdraw_requests` — user withdrawal requests
- `upi_accounts` — UPI IDs for receiving deposits

---

## Default Admin Login

```
Email: admin@hks.com
Password: admin123
```

---

## Development (Replit)

```bash
# Install dependencies
cd Payment-System-Complete && pnpm install

# Push schema to Neon
pnpm --filter @workspace/db run push

# Seed database (admin + markets + UPI)
pnpm --filter @workspace/scripts run seed

# Start backend (port 8080)
PORT=8080 pnpm --filter @workspace/api-server run dev

# Start admin panel (port 5000)
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/admin run dev
```

---

## Deployment to Hostinger (Admin Panel)

### Step 1 — Build with your backend URL

```bash
cd Payment-System-Complete
VITE_API_BASE_URL=https://your-backend.onrender.com PORT=5000 BASE_PATH=/ pnpm --filter @workspace/admin run build
```

### Step 2 — Upload to Hostinger

Upload everything inside `artifacts/admin/dist/public/` to your Hostinger `public_html` folder.

The `.htaccess` file handles SPA routing automatically.

### Step 3 — Set up CORS on backend

Make sure the backend allows your Hostinger domain. Update `artifacts/api-server/src/app.ts`:

```typescript
app.use(cors({ origin: ["https://your-hostinger-domain.com", "*"] }));
```

---

## Deployment to Render/Railway (Backend)

### Step 1 — Set environment variables

```
DATABASE_URL=postgresql://neondb_owner:...
JWT_SECRET=haryana-ki-shan-secret-2024
ADMIN_JWT_SECRET=haryana-ki-shan-admin-secret-2024
PORT=8080
```

### Step 2 — Build command

```bash
cd Payment-System-Complete && pnpm install && pnpm --filter @workspace/api-server run build
```

### Step 3 — Start command

```bash
node Payment-System-Complete/artifacts/api-server/dist/index.cjs
```

---

## Mobile App API URL

Edit `artifacts/mobile/lib/api.ts` and update `BASE_URL`:

```typescript
const BASE_URL = "https://your-backend.onrender.com/api";
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login user |
| GET | `/api/auth/me` | User | Get current user |
| GET | `/api/markets` | No | List active markets |
| POST | `/api/bets` | User | Place a bet |
| GET | `/api/bets/my` | User | Get my bets |
| GET | `/api/wallet/balance` | User | Get wallet balance |
| POST | `/api/wallet/deposit` | User | Request deposit |
| POST | `/api/wallet/withdraw` | User | Request withdrawal |
| GET | `/api/results/latest` | No | Get latest results |
| POST | `/api/admin/login` | No | Admin login |
| GET | `/api/admin/dashboard` | Admin | Dashboard stats |
| GET | `/api/admin/users` | Admin | List all users |
| GET | `/api/admin/deposits` | Admin | Pending deposits |
| POST | `/api/admin/deposits/:id/approve` | Admin | Approve deposit |
| POST | `/api/admin/deposits/:id/reject` | Admin | Reject deposit |
| GET | `/api/admin/withdrawals` | Admin | Pending withdrawals |
| POST | `/api/admin/withdrawals/:id/approve` | Admin | Approve withdrawal |
| POST | `/api/admin/markets` | Admin | Create market |
| PUT | `/api/admin/markets/:id` | Admin | Update market |
| POST | `/api/admin/results` | Admin | Declare result |
| GET | `/api/admin/upi` | Admin | List UPI accounts |
| POST | `/api/admin/upi` | Admin | Add UPI account |
