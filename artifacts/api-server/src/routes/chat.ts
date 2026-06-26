import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { orderMessagesTable, ordersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser, isAdminSession } from "../lib/session";

const router = Router();

const clients = new Map<number, Response[]>();

router.get("/:orderId/stream", async (req: Request, res: Response) => {
  const orderId = Number(req.params.orderId);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const arr = clients.get(orderId) || [];
  arr.push(res);
  clients.set(orderId, arr);

  const ping = setInterval(() => res.write(": ping\n\n"), 25000);
  req.on("close", () => {
    clearInterval(ping);
    const arr = clients.get(orderId) || [];
    clients.set(orderId, arr.filter(c => c !== res));
  });
});

router.post("/:orderId/send", async (req: Request, res: Response) => {
  try {
    const user = await getSessionUser(req);
    const isAdmin = isAdminSession(req);
    if (!user && !isAdmin) return res.status(401).json({ error: "Unauthorized" });

    const orderId = Number(req.params.orderId);
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: "Message required" });

    if (!isAdmin && user) {
      const [order] = await db.select({ user_id: ordersTable.user_id })
        .from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
      if (!order) return res.status(404).json({ error: "Order not found" });
      if (order.user_id !== user.id) return res.status(403).json({ error: "Forbidden" });
    }

    const [msg] = await db.insert(orderMessagesTable).values({
      order_id: orderId,
      sender: isAdmin ? "admin" : "client",
      message: message.trim(),
    }).returning();

    const payload = JSON.stringify({ type: "message", message: msg });
    const arr = clients.get(orderId) || [];
    arr.forEach(c => c.write(`data: ${payload}\n\n`));

    res.json({ ok: true, message: msg });
  } catch (e) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

export function broadcastOrderUpdate(orderId: number, payload: object) {
  const data = JSON.stringify(payload);
  const arr = clients.get(orderId) || [];
  arr.forEach(c => c.write(`data: ${data}\n\n`));
}

export default router;
