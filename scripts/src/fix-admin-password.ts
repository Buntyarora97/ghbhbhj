import "dotenv/config";
import crypto from "crypto";

process.env.DATABASE_URL =
  "postgresql://neondb_owner:npg_binRov64QBNM@ep-soft-scene-a4b8c8kv-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

import { db } from "@workspace/db";
import { adminsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const JWT_SECRET = "haryana-ki-shan-secret-2024";

async function fixPassword() {
  const hash = crypto
    .createHash("sha256")
    .update("admin123" + JWT_SECRET)
    .digest("hex");

  console.log("Correct hash:", hash);

  const existing = await db.select().from(adminsTable);
  console.log(
    "Current admins:",
    existing.map((a) => ({ email: a.email, currentHash: a.password }))
  );

  await db
    .update(adminsTable)
    .set({ password: hash })
    .where(eq(adminsTable.email, "admin@hks.com"));

  console.log("✅ Password fixed! Login: admin@hks.com / admin123");
  process.exit(0);
}

fixPassword().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
