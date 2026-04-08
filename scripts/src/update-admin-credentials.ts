import "dotenv/config";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
import dotenv from "dotenv";
dotenv.config({ path: resolve(__dirname, "../../.env"), override: true });

import { db, adminsTable } from "@workspace/db";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "haryana-ki-shan-secret-2024";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + JWT_SECRET).digest("hex");
}

async function run() {
  const newEmail = "Narendersoni@haryana";
  const newPassword = "Narender@#000#@";
  const newName = "Narendra Soni";

  const hashed = hashPassword(newPassword);
  console.log("Password hash:", hashed);

  const existing = await db.select().from(adminsTable);
  const superAdmin = existing.find((a) => a.isSuperAdmin);

  if (!superAdmin) {
    console.error("No super admin found!");
    process.exit(1);
  }

  const { eq } = await import("drizzle-orm");

  const result = await db
    .update(adminsTable)
    .set({ email: newEmail, name: newName, password: hashed })
    .where(eq(adminsTable.id, superAdmin.id))
    .returning({ id: adminsTable.id, email: adminsTable.email, name: adminsTable.name });

  console.log("Credentials updated successfully:", result);
  process.exit(0);
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
