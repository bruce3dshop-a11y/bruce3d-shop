import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderStatusHistoryTable, usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { getPayment } from "../lib/yookassa";
import { sendTelegram } from "../lib/telegram";
import { broadcastOrderUpdate } from "./chat";

const router = Router();

// ЮКасса вызывает этот URL когда клиент оплатил
router.post("/webhook", async (req, res) => {
  try {
    const event = req.body as {
      type: string;
      object?: {
        id: string;
        status: string;
        paid: boolean;
        metadata?: { order_id?: string; order_number?: string };
      };
    };

    if (!event?.object?.id) return res.status(400).json({ error: "Invalid payload" });
    if (event.type !== "payment.succeeded") return res.json({ ok: true });

    const paymentId = event.object.id;
    const orderId = Number(event.object.metadata?.order_id);
    if (!orderId) return res.json({ ok: true });

    // Двойная проверка через API ЮКасса
    const payment = await getPayment(paymentId);
    if (!payment.paid || payment.status !== "succeeded") return res.json({ ok: true });

    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
    if (!order || order.status === "confirmed") return res.json({ ok: true });

    await db.update(ordersTable).set({ status: "confirmed", updated_at: new Date() }).where(eq(ordersTable.id, orderId));
    await db.insert(orderStatusHistoryTable).values({
      order_id: orderId,
      status: "confirmed",
      comment: `Оплачено через ЮКасса (платёж ${paymentId})`,
    });

    broadcastOrderUpdate(orderId, { type: "status", status: "confirmed" });

    if (order.user_id) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, order.user_id)).limit(1);
      if (user?.telegram) {
        await sendTelegram(user.telegram, `✅ <b>Оплата получена!</b>\n\n📋 Заказ <b>#${order.order_number}</b> оплачен и подтверждён.\n\nСпасибо! Мы приступим к работе.`).catch(console.error);
      }
    }

    console.log(`[yookassa] Order #${order.order_number} confirmed via payment ${paymentId}`);
    return res.json({ ok: true });
  } catch (e) {
    console.error("[yookassa webhook error]", e);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
});

// Проверка статуса платежа по orderId
router.get("/status/:orderId", async (req, res) => {
  try {
    const [order] = await db.select({
      id: ordersTable.id, status: ordersTable.status, payment_link: ordersTable.payment_link,
    }).from(ordersTable).where(eq(ordersTable.id, Number(req.params.orderId))).limit(1);

    if (!order) return res.status(404).json({ error: "Not found" });

    const rawLink = order.payment_link?.startsWith("yookassa:") ? order.payment_link.slice(9) : null;
      const paymentId = rawLink ? rawLink.split("|")[0] : null

    if (!paymentId) return res.json({ status: order.status, paymentStatus: null });

    const payment = await getPayment(paymentId);
    return res.json({ status: order.status, paymentStatus: payment.status, paid: payment.paid });
  } catch (e) {
    res.status(500).json({ error: "Failed to check payment status" });
  }
});

export default router;
