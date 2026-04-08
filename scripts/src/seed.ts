import "dotenv/config";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
import dotenv from "dotenv";
dotenv.config({ path: resolve(__dirname, "../../.env"), override: true });

import { db } from "@workspace/db";
import {
  adminsTable,
  marketsTable,
  upiAccountsTable,
} from "@workspace/db";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "haryana-ki-shan-secret-2024";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + JWT_SECRET).digest("hex");
}

async function seed() {
  console.log("🌱 Seeding database...\n");

  const existing = await db.select().from(adminsTable);
  if (existing.length === 0) {
    await db.insert(adminsTable).values({
      email: "admin@hks.com",
      password: hashPassword("admin123"),
      name: "Super Admin",
      isActive: true,
      isSuperAdmin: true,
      taxRate: "10",
      jodiMultiplier: "90",
      singleMultiplier: "9",
      haruftMultiplier: "9",
    });
    console.log("✅ Super Admin created: admin@hks.com / admin123");
  } else {
    await db.update(adminsTable).set({ isSuperAdmin: true, haruftMultiplier: "9" }).where(
      (await import("drizzle-orm")).eq(adminsTable.id, existing[0].id)
    );
    console.log("ℹ️  Admin already exists - updated to super admin");
  }

  const existingMarkets = await db.select().from(marketsTable);
  if (existingMarkets.length === 0) {
    const markets = [
      { name: "Haryana Morning", resultTime: "11:00 AM", isActive: true, isLive: false },
      { name: "Haryana Day", resultTime: "02:00 PM", isActive: true, isLive: false },
      { name: "Haryana Evening", resultTime: "05:30 PM", isActive: true, isLive: false },
      { name: "Haryana Night", resultTime: "09:00 PM", isActive: true, isLive: false },
      { name: "Delhi Bazar", resultTime: "03:00 PM", isActive: true, isLive: false },
      { name: "Rajdhani Night", resultTime: "10:00 PM", isActive: true, isLive: false },
      { name: "Gali", resultTime: "11:30 PM", isActive: true, isLive: false },
      { name: "Desawar", resultTime: "05:00 AM", isActive: true, isLive: false },
    ];
    await db.insert(marketsTable).values(markets);
    console.log(`✅ ${markets.length} markets created`);
  } else {
    console.log(`ℹ️  Markets already exist (${existingMarkets.length})`);
  }

  const existingUpi = await db.select().from(upiAccountsTable);
  if (existingUpi.length === 0) {
    await db.insert(upiAccountsTable).values({
      upiId: "admin@ybl",
      holderName: "Haryana Ki Shan",
      isActive: true,
      rotationOrder: 1,
    });
    console.log("✅ Default UPI account created: admin@ybl");
  } else {
    console.log(`ℹ️  UPI accounts already exist (${existingUpi.length})`);
  }

  console.log("\n✅ Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
