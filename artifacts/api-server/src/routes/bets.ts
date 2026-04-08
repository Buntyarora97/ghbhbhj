import { Router } from "express";
import { db } from "@workspace/db";
import { betsTable, marketsTable, usersTable, transactionsTable, adminsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authMiddleware } from "../lib/auth.js";

const router = Router();

function validateNumber(gameType: string, number: string): string | null {
  if (gameType === "jodi") {
    const num = parseInt(number);
    if (isNaN(num) || num < 0 || num > 99) return "Jodi number must be 00-99";
    return null;
  } else {
    const num = parseInt(number);
    if (isNaN(num) || num < 0 || num > 9) return "Haruf number must be 0-9";
    return null;
  }
}

router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { marketId, gameType, number, amount } = req.body;

    if (!marketId || !gameType || number === undefined || !amount) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    if (!["jodi", "haruf"].includes(gameType)) {
      return res.status(400).json({ success: false, message: "Invalid game type. Use jodi or haruf." });
    }

    if (amount < 10) {
      return res.status(400).json({ success: false, message: "Minimum bet is ₹10" });
    }

    const validationError = validateNumber(gameType, number.toString());
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.isBlocked) return res.status(403).json({ success: false, message: "Account blocked" });

    const balance = parseFloat(user.walletBalance);
    if (balance < amount) {
      return res.status(400).json({ success: false, message: "Insufficient wallet balance" });
    }

    const [market] = await db.select().from(marketsTable).where(eq(marketsTable.id, marketId)).limit(1);
    if (!market) return res.status(404).json({ success: false, message: "Market not found" });
    if (!market.isActive) return res.status(400).json({ success: false, message: "Market is closed" });

    const [adminSettings] = await db.select().from(adminsTable).limit(1);
    const jodiMultiplier = adminSettings ? parseFloat(adminSettings.jodiMultiplier) : 90;
    const haruftMultiplier = adminSettings ? parseFloat(adminSettings.haruftMultiplier || adminSettings.singleMultiplier) : 9;
    const multiplier = gameType === "jodi" ? jodiMultiplier : haruftMultiplier;
    const winAmount = amount * multiplier;

    const formattedNumber = gameType === "jodi"
      ? number.toString().padStart(2, "0")
      : number.toString();

    const newBalance = balance - amount;
    await db.update(usersTable).set({ walletBalance: newBalance.toFixed(2) }).where(eq(usersTable.id, userId));

    const [bet] = await db.insert(betsTable).values({
      userId,
      marketId,
      marketName: market.name,
      gameType,
      number: formattedNumber,
      amount: amount.toFixed(2),
      winAmount: winAmount.toFixed(2),
      status: "pending",
    }).returning();

    await db.insert(transactionsTable).values({
      userId,
      type: "bet",
      amount: amount.toFixed(2),
      status: "completed",
      description: `Bet on ${market.name} - ${gameType === "jodi" ? "Jodi" : "Haruf"} ${formattedNumber}`,
      referenceId: bet.id.toString(),
    });

    return res.json({
      success: true,
      bet: {
        id: bet.id,
        marketName: bet.marketName,
        gameType: bet.gameType,
        number: bet.number,
        amount: bet.amount,
        winAmount: bet.winAmount,
        status: bet.status,
        createdAt: bet.createdAt.toISOString(),
      },
      newBalance: newBalance.toFixed(2),
    });
  } catch (err) {
    console.error("Bet error:", err);
    return res.status(500).json({ success: false, message: "Error placing bet" });
  }
});

router.post("/multi", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { marketId, bets: betsList } = req.body;

    if (!marketId || !Array.isArray(betsList) || betsList.length === 0) {
      return res.status(400).json({ success: false, message: "marketId and bets array required" });
    }

    if (betsList.length > 50) {
      return res.status(400).json({ success: false, message: "Maximum 50 bets per request" });
    }

    for (const b of betsList) {
      if (!b.gameType || b.number === undefined || !b.amount) {
        return res.status(400).json({ success: false, message: "Each bet needs gameType, number, amount" });
      }
      if (!["jodi", "haruf"].includes(b.gameType)) {
        return res.status(400).json({ success: false, message: `Invalid game type: ${b.gameType}` });
      }
      if (b.amount < 10) {
        return res.status(400).json({ success: false, message: "Minimum bet is ₹10 per number" });
      }
      const err = validateNumber(b.gameType, b.number.toString());
      if (err) return res.status(400).json({ success: false, message: err });
    }

    const totalAmount = betsList.reduce((sum: number, b: any) => sum + parseFloat(b.amount), 0);

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.isBlocked) return res.status(403).json({ success: false, message: "Account blocked" });

    const balance = parseFloat(user.walletBalance);
    if (balance < totalAmount) {
      return res.status(400).json({ success: false, message: `Insufficient balance. Need ₹${totalAmount.toFixed(2)}, have ₹${balance.toFixed(2)}` });
    }

    const [market] = await db.select().from(marketsTable).where(eq(marketsTable.id, marketId)).limit(1);
    if (!market) return res.status(404).json({ success: false, message: "Market not found" });
    if (!market.isActive) return res.status(400).json({ success: false, message: "Market is closed" });

    const [adminSettings] = await db.select().from(adminsTable).limit(1);
    const jodiMultiplier = adminSettings ? parseFloat(adminSettings.jodiMultiplier) : 90;
    const haruftMultiplier = adminSettings ? parseFloat(adminSettings.haruftMultiplier || adminSettings.singleMultiplier) : 9;

    const newBalance = balance - totalAmount;
    await db.update(usersTable).set({ walletBalance: newBalance.toFixed(2) }).where(eq(usersTable.id, userId));

    const placedBets = [];
    for (const b of betsList) {
      const formattedNumber = b.gameType === "jodi"
        ? b.number.toString().padStart(2, "0")
        : b.number.toString();
      const multiplier = b.gameType === "jodi" ? jodiMultiplier : haruftMultiplier;
      const winAmt = parseFloat(b.amount) * multiplier;

      const [bet] = await db.insert(betsTable).values({
        userId,
        marketId,
        marketName: market.name,
        gameType: b.gameType,
        number: formattedNumber,
        amount: parseFloat(b.amount).toFixed(2),
        winAmount: winAmt.toFixed(2),
        status: "pending",
      }).returning();

      placedBets.push(bet);
    }

    await db.insert(transactionsTable).values({
      userId,
      type: "bet",
      amount: totalAmount.toFixed(2),
      status: "completed",
      description: `Multi-bet on ${market.name} - ${betsList.length} numbers`,
      referenceId: placedBets[0]?.id?.toString(),
    });

    return res.json({
      success: true,
      betsPlaced: placedBets.length,
      totalAmount: totalAmount.toFixed(2),
      newBalance: newBalance.toFixed(2),
      bets: placedBets.map(b => ({
        id: b.id,
        number: b.number,
        gameType: b.gameType,
        amount: b.amount,
        winAmount: b.winAmount,
        status: b.status,
      })),
    });
  } catch (err) {
    console.error("Multi-bet error:", err);
    return res.status(500).json({ success: false, message: "Error placing bets" });
  }
});

router.get("/my", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const bets = await db.select().from(betsTable)
      .where(eq(betsTable.userId, userId))
      .orderBy(desc(betsTable.createdAt))
      .limit(100);
    return res.json({
      bets: bets.map(b => ({
        id: b.id,
        marketName: b.marketName,
        gameType: b.gameType,
        number: b.number,
        amount: b.amount,
        winAmount: b.winAmount,
        status: b.status,
        createdAt: b.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error fetching bets" });
  }
});

export default router;
