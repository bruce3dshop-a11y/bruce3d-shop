import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderStatusHistoryTable, usersTable, reviewsTable, galleryItemsTable, productsTable } from "@workspace/db/schema";
import { eq, sql, sum, desc } from "drizzle-orm";
import { isAdminSession } from "../lib/session";
import { sendTelegram } from "../lib/telegram";
import { getConfig, updateConfig } from "../lib/configStore";

const router = Router();

function requireAdmin(req: any, res: any, next: any) {
  if (!isAdminSession(req)) return res.status(401).json({ error: "Admin required" });
  next();
}

async function notifyClient(orderId: number, message: string) {
  try {
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
    if (!order) return;
    if (order.user_id) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, order.user_id)).limit(1);
      if (user?.telegram) {
        await sendTelegram(user.telegram, message);
      }
    }
  } catch {}
}

// ===== ORDERS =====
router.get("/orders", requireAdmin, async (req, res) => {
  try {
    const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.created_at));
    res.json({ orders });
  } catch {
    res.status(500).json({ error: "Failed to get orders" });
  }
});

router.get("/stats", requireAdmin, async (_req, res) => {
  try {
    const ordersByStatus = await db.select({
      status: ordersTable.status,
      total: sql<number>`count(*)`.as("total"),
    }).from(ordersTable).groupBy(ordersTable.status);

    const [totalUsersRow] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
    const [revenueRow] = await db.select({ total: sum(ordersTable.price) }).from(ordersTable)
      .where(eq(ordersTable.status, "confirmed"));

    // orders last 30 days
    const last30 = await db.select({ count: sql<number>`count(*)` }).from(ordersTable)
      .where(sql`created_at > now() - interval '30 days'`);

    // popular services
    const popularServices = await db.select({
      service: ordersTable.service_type,
      count: sql<number>`count(*)`.as("count"),
    }).from(ordersTable).groupBy(ordersTable.service_type).orderBy(sql`count(*) desc`).limit(4);

    res.json({
      ordersByStatus,
      totalUsers: totalUsersRow?.count || 0,
      totalRevenue: Number(revenueRow?.total || 0),
      ordersLast30Days: last30[0]?.count || 0,
      popularServices,
    });
  } catch {
    res.status(500).json({ error: "Failed to get stats" });
  }
});

router.patch("/orders/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status, comment } = req.body;
    const orderId = Number(req.params.id);
    await db.update(ordersTable).set({ status, updated_at: new Date() }).where(eq(ordersTable.id, orderId));
    await db.insert(orderStatusHistoryTable).values({ order_id: orderId, status, comment });

    const statusMsg: Record<string, string> = {
      calculating: "🔍 Ваш заказ рассчитывается. Ожидайте сообщения о стоимости.",
      accepted: "✅ Ваш заказ принят в производство!",
      working: "🔧 Идёт подготовка к печати!",
      printing: "🖨 Ваш заказ сейчас печатается!",
      postprocess: "✨ Постобработка и контроль качества!",
      ready: "📦 Ваш заказ готов к выдаче/отправке!",
      shipped: "🚚 Ваш заказ отправлен! Ожидайте доставки.",
      completed: "🎉 Заказ завершён! Спасибо за заказ в BRUCE 3D SHOP!",
      rejected: "❌ Ваш заказ отклонён. Свяжитесь с нами для уточнения.",
    };
    const msg = statusMsg[status];
    if (msg) {
      const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
      if (order) {
        const fullMsg = `${msg}\n\n📋 Заказ #${order.order_number}${comment ? `\n💬 ${comment}` : ""}`;
        notifyClient(orderId, fullMsg).catch(console.error);
      }
    }
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to update status" });
  }
});

router.patch("/orders/:id/price", requireAdmin, async (req, res) => {
  try {
    const { price, paymentLink } = req.body;
    const orderId = Number(req.params.id);
    await db.update(ordersTable).set({
      price: String(price),
      payment_link: paymentLink || null,
      status: "accepted",
      updated_at: new Date(),
    }).where(eq(ordersTable.id, orderId));
    await db.insert(orderStatusHistoryTable).values({
      order_id: orderId,
      status: "accepted",
      comment: `Выставлен счёт: ${price} ₽${paymentLink ? " | Ссылка оплаты: " + paymentLink : ""}`,
    });

    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
    if (order) {
      const msg = `💰 <b>Выставлен счёт по заказу #${order.order_number}</b>\n\n💵 Сумма: <b>${price} ₽</b>${paymentLink ? `\n\n🔗 Ссылка для оплаты: ${paymentLink}` : ""}\n\nЗайдите в личный кабинет, чтобы подтвердить заказ.`;
      notifyClient(orderId, msg).catch(console.error);
    }
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to set price" });
  }
});

// ===== CLIENTS =====
router.get("/clients", requireAdmin, async (_req, res) => {
  try {
    const users = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      phone: usersTable.phone,
      telegram: usersTable.telegram,
      created_at: usersTable.created_at,
      orderCount: sql<number>`(SELECT count(*) FROM orders WHERE user_id = users.id)`.as("orderCount"),
      totalSpent: sql<number>`(SELECT coalesce(sum(price::numeric), 0) FROM orders WHERE user_id = users.id AND status = 'confirmed')`.as("totalSpent"),
    }).from(usersTable).orderBy(desc(usersTable.created_at));
    res.json({ clients: users });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/clients/:id/orders", requireAdmin, async (req, res) => {
  try {
    const orders = await db.select().from(ordersTable)
      .where(eq(ordersTable.user_id, Number(req.params.id)))
      .orderBy(desc(ordersTable.created_at));
    res.json({ orders });
  } catch {
    res.status(500).json({ error: "DB error" });
  }
});

// ===== REVIEWS =====
router.get("/reviews", requireAdmin, async (_req, res) => {
  try {
    const reviews = await db.select().from(reviewsTable).orderBy(desc(reviewsTable.created_at));
    res.json({ reviews });
  } catch {
    res.status(500).json({ error: "Failed to get reviews" });
  }
});

router.post("/reviews/:id/approve", requireAdmin, async (req, res) => {
  try {
    await db.update(reviewsTable).set({ approved: true }).where(eq(reviewsTable.id, Number(req.params.id)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to approve review" });
  }
});

router.post("/reviews/:id/pin", requireAdmin, async (req, res) => {
  try {
    const { pinned } = req.body;
    await db.update(reviewsTable).set({ pinned: !!pinned, approved: true }).where(eq(reviewsTable.id, Number(req.params.id)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to pin review" });
  }
});

router.delete("/reviews/:id", requireAdmin, async (req, res) => {
  try {
    await db.delete(reviewsTable).where(eq(reviewsTable.id, Number(req.params.id)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete review" });
  }
});

// ===== GALLERY =====
router.get("/gallery", requireAdmin, async (_req, res) => {
  try {
    const items = await db.select().from(galleryItemsTable).orderBy(desc(galleryItemsTable.created_at));
    res.json({ items });
  } catch {
    res.status(500).json({ error: "Failed to get gallery" });
  }
});

router.delete("/gallery/:id", requireAdmin, async (req, res) => {
  try {
    await db.delete(galleryItemsTable).where(eq(galleryItemsTable.id, Number(req.params.id)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete gallery item" });
  }
});

// ===== PRODUCTS =====
router.get("/products", requireAdmin, async (_req, res) => {
  try {
    const products = await db.select().from(productsTable).orderBy(productsTable.sort_order);
    res.json({ products });
  } catch {
    res.status(500).json({ error: "DB error" });
  }
});

router.patch("/products/:id", requireAdmin, async (req, res) => {
  try {
    const [p] = await db.update(productsTable).set(req.body).where(eq(productsTable.id, Number(req.params.id))).returning();
    res.json({ product: p });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/products/:id", requireAdmin, async (req, res) => {
  try {
    await db.delete(productsTable).where(eq(productsTable.id, Number(req.params.id)));
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== BOT CONFIG (group chat) =====
router.get("/bot-config", requireAdmin, (_req, res) => {
  try {
    const cfg = getConfig();
    res.json({ groupChatId: cfg.groupChatId, adminChatId: cfg.adminChatId, webhookDomain: cfg.webhookDomain, botConfigured: !!cfg.botToken });
  } catch { res.status(500).json({ error: "Failed" }); }
});

router.post("/bot-config", requireAdmin, (req, res) => {
  try {
    const { groupChatId } = req.body;
    updateConfig({ groupChatId: groupChatId ?? "" });
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Failed" }); }
});

// ===== BROADCAST =====
router.post("/broadcast", requireAdmin, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });
    const users = await db.select({ telegram: usersTable.telegram }).from(usersTable);
    let sent = 0;
    for (const u of users) {
      if (u.telegram) {
        await sendTelegram(u.telegram, `📢 <b>BRUCE 3D SHOP</b>\n\n${message}`).catch(() => {});
        sent++;
      }
    }
    res.json({ ok: true, sent });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
