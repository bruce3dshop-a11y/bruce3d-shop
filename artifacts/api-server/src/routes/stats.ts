import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, usersTable } from "@workspace/db/schema";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const [ordersRow] = await db.select({ count: sql<number>`count(*)` }).from(ordersTable);
    const [usersRow] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
    res.json({
      stats: {
        orders_count: Number(ordersRow?.count || 0),
        clients_count: Number(usersRow?.count || 0),
      },
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to get stats" });
  }
});

export default router;
