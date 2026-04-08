import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable, marketsTable, betsTable, transactionsTable, resultsTable,
  upiAccountsTable, depositRequestsTable, withdrawRequestsTable, adminsTable
} from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { signToken, hashPassword, adminAuthMiddleware, verifyToken, ADMIN_JWT_SECRET } from "../lib/auth.js";

const router = Router();

async function getAdminFromReq(req: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "").replace("bearer ", "");
  const payload = verifyToken(token, ADMIN_JWT_SECRET);
  if (!payload) return null;
  const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.id, payload.adminId as number)).limit(1);
  return admin || null;
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }
    const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.email, email)).limit(1);
    if (!admin || !admin.isActive) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }
    const hashed = hashPassword(password);
    if (admin.password !== hashed) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }
    const token = signToken({ adminId: admin.id, email: admin.email, isAdmin: true }, ADMIN_JWT_SECRET);
    return res.json({
      success: true,
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email, isSuperAdmin: admin.isSuperAdmin },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Login failed" });
  }
});

router.get("/me", adminAuthMiddleware, async (req, res) => {
  try {
    const admin = await getAdminFromReq(req);
    if (!admin) return res.status(401).json({ success: false, message: "Unauthorized" });
    return res.json({
      admin: { id: admin.id, name: admin.name, email: admin.email, isSuperAdmin: admin.isSuperAdmin }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error" });
  }
});

router.get("/dashboard", adminAuthMiddleware, async (_req, res) => {
  try {
    const [adminSettings] = await db.select().from(adminsTable).limit(1);
    const taxRate = adminSettings ? parseFloat(adminSettings.taxRate) / 100 : 0.1;

    const users = await db.select().from(usersTable);
    const totalUsers = users.length;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = users.filter(u => u.createdAt > thirtyDaysAgo).length;

    const deposits = await db.select().from(transactionsTable).where(eq(transactionsTable.type, "deposit"));
    const totalDeposits = deposits.reduce((s, t) => s + parseFloat(t.amount), 0);

    const withdrawals = await db.select().from(transactionsTable).where(eq(transactionsTable.type, "withdraw"));
    const totalWithdrawals = withdrawals.reduce((s, t) => s + parseFloat(t.amount), 0);

    const bets = await db.select().from(transactionsTable).where(eq(transactionsTable.type, "bet"));
    const totalBets = bets.reduce((s, t) => s + parseFloat(t.amount), 0);

    const wins = await db.select().from(transactionsTable).where(eq(transactionsTable.type, "win"));
    const totalWinnings = wins.reduce((s, t) => s + parseFloat(t.amount), 0);

    const netProfit = totalBets - totalWinnings;
    const taxAmount = netProfit > 0 ? netProfit * taxRate : 0;

    const pendingDeposits = await db.select().from(depositRequestsTable).where(eq(depositRequestsTable.status, "pending"));
    const pendingWithdrawals = await db.select().from(withdrawRequestsTable).where(eq(withdrawRequestsTable.status, "pending"));

    return res.json({
      totalUsers,
      activeUsers,
      totalDeposits: totalDeposits.toFixed(2),
      totalWithdrawals: totalWithdrawals.toFixed(2),
      totalBets: totalBets.toFixed(2),
      totalWinnings: totalWinnings.toFixed(2),
      netProfit: netProfit.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      pendingDeposits: pendingDeposits.length,
      pendingWithdrawals: pendingWithdrawals.length,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return res.status(500).json({ success: false, message: "Error fetching dashboard" });
  }
});

router.get("/users", adminAuthMiddleware, async (_req, res) => {
  try {
    const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
    return res.json({
      users: users.map(u => ({
        id: u.id,
        name: u.name,
        phone: u.phone,
        upiId: u.upiId,
        walletBalance: u.walletBalance,
        referralCode: u.referralCode,
        isBlocked: u.isBlocked,
        createdAt: u.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error fetching users" });
  }
});

router.patch("/users/:id/block", adminAuthMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { isBlocked } = req.body;
    await db.update(usersTable).set({ isBlocked }).where(eq(usersTable.id, id));
    return res.json({ success: true, message: `User ${isBlocked ? "blocked" : "unblocked"}` });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error" });
  }
});

router.patch("/users/:id/balance", adminAuthMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { amount, operation } = req.body;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    let newBal = parseFloat(user.walletBalance);
    if (operation === "add") newBal += amount;
    else if (operation === "subtract") newBal = Math.max(0, newBal - amount);
    else newBal = amount;
    await db.update(usersTable).set({ walletBalance: newBal.toFixed(2) }).where(eq(usersTable.id, id));
    await db.insert(transactionsTable).values({
      userId: id,
      type: "deposit",
      amount: amount.toFixed(2),
      status: "completed",
      description: `Admin balance adjustment (${operation})`,
    });
    return res.json({ success: true, message: "Balance updated" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error" });
  }
});

router.patch("/users/:id/password", adminAuthMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ success: false, message: "Password must be at least 4 characters" });
    }
    const hashed = hashPassword(newPassword);
    await db.update(usersTable).set({ password: hashed }).where(eq(usersTable.id, id));
    return res.json({ success: true, message: "User password updated" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error" });
  }
});

router.get("/markets", adminAuthMiddleware, async (_req, res) => {
  try {
    const markets = await db.select().from(marketsTable).orderBy(marketsTable.id);
    return res.json({ markets: markets.map(m => ({ id: m.id, name: m.name, resultTime: m.resultTime, isActive: m.isActive, latestResult: m.latestResult, isLive: m.isLive })) });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error" });
  }
});

router.post("/markets", adminAuthMiddleware, async (req, res) => {
  try {
    const { name, resultTime, isActive } = req.body;
    await db.insert(marketsTable).values({ name, resultTime, isActive: isActive ?? true });
    return res.json({ success: true, message: "Market created" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error creating market" });
  }
});

router.patch("/markets/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, resultTime, isActive, isLive } = req.body;
    await db.update(marketsTable).set({ name, resultTime, isActive, isLive }).where(eq(marketsTable.id, id));
    return res.json({ success: true, message: "Market updated" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error" });
  }
});

router.delete("/markets/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(marketsTable).where(eq(marketsTable.id, id));
    return res.json({ success: true, message: "Market deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error" });
  }
});

router.post("/results", adminAuthMiddleware, async (req, res) => {
  try {
    const { marketId, resultNumber } = req.body;
    const [market] = await db.select().from(marketsTable).where(eq(marketsTable.id, marketId)).limit(1);
    if (!market) return res.status(404).json({ success: false, message: "Market not found" });

    const today = new Date().toISOString().split("T")[0];
    await db.insert(resultsTable).values({
      marketId,
      marketName: market.name,
      resultNumber,
      gameDate: today,
    });

    await db.update(marketsTable).set({ latestResult: resultNumber }).where(eq(marketsTable.id, marketId));

    const [adminSettings] = await db.select().from(adminsTable).limit(1);
    const jodiMultiplier = adminSettings ? parseFloat(adminSettings.jodiMultiplier) : 90;
    const haruftMultiplier = adminSettings ? parseFloat(adminSettings.haruftMultiplier || adminSettings.singleMultiplier) : 9;

    const pendingBets = await db.select().from(betsTable).where(
      and(eq(betsTable.marketId, marketId), eq(betsTable.status, "pending"))
    );

    const jodiResult = resultNumber.toString().padStart(2, "0");
    const haruftResult = jodiResult[jodiResult.length - 1];

    let totalWinners = 0;
    let totalWinAmount = 0;

    for (const bet of pendingBets) {
      let won = false;
      let winAmount = 0;

      if (bet.gameType === "jodi" && bet.number === jodiResult) {
        won = true;
        winAmount = parseFloat(bet.amount) * jodiMultiplier;
      } else if ((bet.gameType === "haruf" || bet.gameType === "single") && bet.number === haruftResult) {
        won = true;
        winAmount = parseFloat(bet.amount) * haruftMultiplier;
      }

      if (won) {
        await db.update(betsTable).set({
          status: "win",
          winAmount: winAmount.toFixed(2),
          resultNumber,
        }).where(eq(betsTable.id, bet.id));

        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, bet.userId)).limit(1);
        if (user) {
          const newBalance = parseFloat(user.walletBalance) + winAmount;
          await db.update(usersTable).set({ walletBalance: newBalance.toFixed(2) }).where(eq(usersTable.id, bet.userId));
          await db.insert(transactionsTable).values({
            userId: bet.userId,
            type: "win",
            amount: winAmount.toFixed(2),
            status: "completed",
            description: `Won on ${market.name} - ${bet.gameType === "jodi" ? "Jodi" : "Haruf"} ${bet.number}`,
            referenceId: bet.id.toString(),
          });
          totalWinners++;
          totalWinAmount += winAmount;
        }
      } else {
        await db.update(betsTable).set({ status: "loss", resultNumber }).where(eq(betsTable.id, bet.id));
      }
    }

    return res.json({
      success: true,
      message: `Result declared for ${market.name}`,
      resultNumber,
      totalBetsProcessed: pendingBets.length,
      totalWinners,
      totalWinAmount: totalWinAmount.toFixed(2),
    });
  } catch (err) {
    console.error("Declare result error:", err);
    return res.status(500).json({ success: false, message: "Error declaring result" });
  }
});

router.get("/deposits", adminAuthMiddleware, async (_req, res) => {
  try {
    const deposits = await db.select({
      id: depositRequestsTable.id,
      userId: depositRequestsTable.userId,
      amount: depositRequestsTable.amount,
      upiId: depositRequestsTable.upiId,
      screenshotUrl: depositRequestsTable.screenshotUrl,
      status: depositRequestsTable.status,
      createdAt: depositRequestsTable.createdAt,
      userName: usersTable.name,
      userPhone: usersTable.phone,
    }).from(depositRequestsTable)
      .leftJoin(usersTable, eq(depositRequestsTable.userId, usersTable.id))
      .orderBy(desc(depositRequestsTable.createdAt));
    return res.json({
      deposits: deposits.map(d => ({
        id: d.id,
        userId: d.userId,
        userName: d.userName || "",
        userPhone: d.userPhone || "",
        amount: d.amount,
        upiId: d.upiId,
        screenshotUrl: d.screenshotUrl,
        status: d.status,
        createdAt: d.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error" });
  }
});

router.patch("/deposits/:id/approve", adminAuthMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [deposit] = await db.select().from(depositRequestsTable).where(eq(depositRequestsTable.id, id)).limit(1);
    if (!deposit) return res.status(404).json({ success: false, message: "Deposit not found" });
    if (deposit.status !== "pending") return res.status(400).json({ success: false, message: "Already processed" });

    await db.update(depositRequestsTable).set({ status: "approved" }).where(eq(depositRequestsTable.id, id));
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, deposit.userId)).limit(1);
    if (user) {
      const newBalance = parseFloat(user.walletBalance) + parseFloat(deposit.amount);
      await db.update(usersTable).set({ walletBalance: newBalance.toFixed(2) }).where(eq(usersTable.id, deposit.userId));
      await db.insert(transactionsTable).values({
        userId: deposit.userId,
        type: "deposit",
        amount: deposit.amount,
        status: "completed",
        description: "Deposit approved by admin",
      });
    }
    return res.json({ success: true, message: "Deposit approved" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error" });
  }
});

router.patch("/deposits/:id/reject", adminAuthMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.update(depositRequestsTable).set({ status: "rejected" }).where(eq(depositRequestsTable.id, id));
    return res.json({ success: true, message: "Deposit rejected" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error" });
  }
});

router.get("/withdrawals", adminAuthMiddleware, async (_req, res) => {
  try {
    const withdrawals = await db.select({
      id: withdrawRequestsTable.id,
      userId: withdrawRequestsTable.userId,
      amount: withdrawRequestsTable.amount,
      upiId: withdrawRequestsTable.upiId,
      status: withdrawRequestsTable.status,
      createdAt: withdrawRequestsTable.createdAt,
      userName: usersTable.name,
      userPhone: usersTable.phone,
    }).from(withdrawRequestsTable)
      .leftJoin(usersTable, eq(withdrawRequestsTable.userId, usersTable.id))
      .orderBy(desc(withdrawRequestsTable.createdAt));
    return res.json({
      withdrawals: withdrawals.map(w => ({
        id: w.id,
        userId: w.userId,
        userName: w.userName || "",
        userPhone: w.userPhone || "",
        amount: w.amount,
        upiId: w.upiId,
        status: w.status,
        createdAt: w.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error" });
  }
});

router.patch("/withdrawals/:id/approve", adminAuthMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.update(withdrawRequestsTable).set({ status: "paid" }).where(eq(withdrawRequestsTable.id, id));
    return res.json({ success: true, message: "Withdrawal approved" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error" });
  }
});

router.patch("/withdrawals/:id/reject", adminAuthMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [wr] = await db.select().from(withdrawRequestsTable).where(eq(withdrawRequestsTable.id, id)).limit(1);
    if (!wr || wr.status !== "pending") return res.status(400).json({ success: false, message: "Cannot reject" });
    await db.update(withdrawRequestsTable).set({ status: "rejected" }).where(eq(withdrawRequestsTable.id, id));
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, wr.userId)).limit(1);
    if (user) {
      const newBalance = parseFloat(user.walletBalance) + parseFloat(wr.amount);
      await db.update(usersTable).set({ walletBalance: newBalance.toFixed(2) }).where(eq(usersTable.id, wr.userId));
    }
    return res.json({ success: true, message: "Withdrawal rejected, amount refunded" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error" });
  }
});

router.get("/upi", adminAuthMiddleware, async (_req, res) => {
  try {
    const upiList = await db.select().from(upiAccountsTable).orderBy(upiAccountsTable.rotationOrder);
    return res.json({
      upiAccounts: upiList.map(u => ({ id: u.id, upiId: u.upiId, holderName: u.holderName, isActive: u.isActive })),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error" });
  }
});

router.post("/upi", adminAuthMiddleware, async (req, res) => {
  try {
    const { upiId, holderName } = req.body;
    const count = await db.select().from(upiAccountsTable);
    if (count.length >= 30) {
      return res.status(400).json({ success: false, message: "Maximum 30 UPI accounts allowed" });
    }
    await db.insert(upiAccountsTable).values({ upiId, holderName: holderName || null, rotationOrder: count.length });
    return res.json({ success: true, message: "UPI account added" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error" });
  }
});

router.patch("/upi/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { isActive } = req.body;
    await db.update(upiAccountsTable).set({ isActive }).where(eq(upiAccountsTable.id, id));
    return res.json({ success: true, message: "UPI account updated" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error" });
  }
});

router.delete("/upi/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(upiAccountsTable).where(eq(upiAccountsTable.id, id));
    return res.json({ success: true, message: "UPI deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error" });
  }
});

router.get("/bet-analytics", adminAuthMiddleware, async (req, res) => {
  try {
    const marketId = req.query.marketId ? parseInt(req.query.marketId as string) : undefined;
    const gameType = req.query.gameType as string | undefined;

    let query = db.select().from(betsTable);
    if (marketId) {
      query = query.where(eq(betsTable.marketId, marketId)) as any;
    }
    const allBets = await query;

    const filtered = gameType ? allBets.filter(b => b.gameType === gameType) : allBets;

    const grouped: Record<string, { totalAmount: number; usersCount: Set<number>; betCount: number; gameType: string }> = {};
    for (const bet of filtered) {
      const key = `${bet.gameType}:${bet.number}`;
      if (!grouped[key]) grouped[key] = { totalAmount: 0, usersCount: new Set(), betCount: 0, gameType: bet.gameType };
      grouped[key].totalAmount += parseFloat(bet.amount);
      grouped[key].usersCount.add(bet.userId);
      grouped[key].betCount++;
    }

    const analytics = Object.entries(grouped)
      .map(([key, data]) => {
        const [gt, num] = key.split(":");
        const multiplier = gt === "jodi" ? 90 : 9;
        return {
          number: num,
          gameType: gt,
          totalAmount: data.totalAmount.toFixed(2),
          usersCount: data.usersCount.size,
          betCount: data.betCount,
          potentialLiability: (data.totalAmount * multiplier).toFixed(2),
        };
      })
      .sort((a, b) => parseFloat(b.totalAmount) - parseFloat(a.totalAmount));

    const totalCollected = filtered.reduce((s, b) => s + parseFloat(b.amount), 0);
    const totalPayout = filtered.filter(b => b.status === "win").reduce((s, b) => s + parseFloat(b.winAmount || "0"), 0);

    return res.json({
      analytics,
      totalCollected: totalCollected.toFixed(2),
      totalPayout: totalPayout.toFixed(2),
      netProfit: (totalCollected - totalPayout).toFixed(2),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error fetching analytics" });
  }
});

router.get("/sub-admins", adminAuthMiddleware, async (req, res) => {
  try {
    const admin = await getAdminFromReq(req);
    if (!admin?.isSuperAdmin) {
      return res.status(403).json({ success: false, message: "Only super admin can manage sub-admins" });
    }
    const admins = await db.select().from(adminsTable).orderBy(desc(adminsTable.createdAt));
    return res.json({
      admins: admins.map(a => ({
        id: a.id,
        name: a.name,
        email: a.email,
        isActive: a.isActive,
        isSuperAdmin: a.isSuperAdmin,
        createdAt: a.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error" });
  }
});

router.post("/sub-admins", adminAuthMiddleware, async (req, res) => {
  try {
    const admin = await getAdminFromReq(req);
    if (!admin?.isSuperAdmin) {
      return res.status(403).json({ success: false, message: "Only super admin can create sub-admins" });
    }
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password required" });
    }
    const existing = await db.select().from(adminsTable).where(eq(adminsTable.email, email)).limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "Email already in use" });
    }
    const hashed = hashPassword(password);
    await db.insert(adminsTable).values({
      name,
      email,
      password: hashed,
      isActive: true,
      isSuperAdmin: false,
    });
    return res.json({ success: true, message: "Sub-admin created successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error creating sub-admin" });
  }
});

router.patch("/sub-admins/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const admin = await getAdminFromReq(req);
    if (!admin?.isSuperAdmin) {
      return res.status(403).json({ success: false, message: "Only super admin can update sub-admins" });
    }
    const id = parseInt(req.params.id);
    const { name, password, isActive } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) {
      if (password.length < 4) {
        return res.status(400).json({ success: false, message: "Password must be at least 4 characters" });
      }
      updateData.password = hashPassword(password);
    }

    await db.update(adminsTable).set(updateData).where(eq(adminsTable.id, id));
    return res.json({ success: true, message: "Sub-admin updated" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error" });
  }
});

router.delete("/sub-admins/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const admin = await getAdminFromReq(req);
    if (!admin?.isSuperAdmin) {
      return res.status(403).json({ success: false, message: "Only super admin can delete sub-admins" });
    }
    const id = parseInt(req.params.id);
    if (admin.id === id) {
      return res.status(400).json({ success: false, message: "Cannot delete yourself" });
    }
    await db.delete(adminsTable).where(eq(adminsTable.id, id));
    return res.json({ success: true, message: "Sub-admin deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error" });
  }
});

router.get("/settings", adminAuthMiddleware, async (_req, res) => {
  try {
    const [settings] = await db.select().from(adminsTable).limit(1);
    if (!settings) return res.status(404).json({ success: false, message: "Settings not found" });
    return res.json({
      taxRate: settings.taxRate,
      jodiMultiplier: settings.jodiMultiplier,
      haruftMultiplier: settings.haruftMultiplier || settings.singleMultiplier,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error" });
  }
});

router.patch("/settings", adminAuthMiddleware, async (req, res) => {
  try {
    const admin = await getAdminFromReq(req);
    if (!admin?.isSuperAdmin) {
      return res.status(403).json({ success: false, message: "Only super admin can change settings" });
    }
    const { taxRate, jodiMultiplier, haruftMultiplier } = req.body;
    const [settings] = await db.select().from(adminsTable).where(eq(adminsTable.isSuperAdmin, true)).limit(1);
    if (!settings) return res.status(404).json({ success: false, message: "Settings not found" });
    await db.update(adminsTable).set({
      taxRate: taxRate?.toString() || settings.taxRate,
      jodiMultiplier: jodiMultiplier?.toString() || settings.jodiMultiplier,
      haruftMultiplier: haruftMultiplier?.toString() || settings.haruftMultiplier,
    }).where(eq(adminsTable.id, settings.id));
    return res.json({ success: true, message: "Settings updated" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error" });
  }
});

router.post("/change-password", adminAuthMiddleware, async (req, res) => {
  try {
    const admin = await getAdminFromReq(req);
    if (!admin) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current password and new password required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
    }

    const currentHashed = hashPassword(currentPassword);
    if (admin.password !== currentHashed) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    const newHashed = hashPassword(newPassword);
    await db.update(adminsTable).set({ password: newHashed }).where(eq(adminsTable.id, admin.id));

    return res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error changing password" });
  }
});

router.post("/change-email", adminAuthMiddleware, async (req, res) => {
  try {
    const admin = await getAdminFromReq(req);
    if (!admin) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { currentPassword, newEmail } = req.body;
    if (!currentPassword || !newEmail) {
      return res.status(400).json({ success: false, message: "Current password and new email/username required" });
    }

    const currentHashed = hashPassword(currentPassword);
    if (admin.password !== currentHashed) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    const existing = await db.select().from(adminsTable).where(eq(adminsTable.email, newEmail)).limit(1);
    if (existing.length > 0 && existing[0].id !== admin.id) {
      return res.status(400).json({ success: false, message: "This username/email is already taken" });
    }

    await db.update(adminsTable).set({ email: newEmail }).where(eq(adminsTable.id, admin.id));

    return res.json({ success: true, message: "Username/email changed successfully. Please login again." });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error changing email" });
  }
});

export default router;
