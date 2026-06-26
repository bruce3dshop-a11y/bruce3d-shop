import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderStatusHistoryTable, usersTable, reviewsTable, galleryItemsTable, productsTable } from "@workspace/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { isAdminSession } from "../lib/session";
import { sendTelegram } from "../lib/telegram";
import { getConfig, updateConfig } from "../lib/configStore";
import { createPayment, isYookassaConfigured } from "../lib/yookassa";
import { broadcastOrderUpdate } from "./chat";

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

    // Fix: count revenue from both 'confirmed' AND 'completed' orders
    const [revenueRow] = await db.select({
      total: sql<string>`COALESCE(SUM(price::numeric), 0)`,
    }).from(ordersTable).where(sql`status IN ('confirmed', 'completed')`);

    const last30 = await db.select({ count: sql<number>`count(*)` }).from(ordersTable)
      .where(sql`created_at > now() - interval '30 days'`);

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
  } catch (e) {
    console.error("[admin/stats]", e);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

router.patch("/orders/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status, comment } = req.body;
    const orderId = Number(req.params.id);
    await db.update(ordersTable).set({ status, updated_at: new Date() }).where(eq(ordersTable.id, orderId));
    await db.insert(orderStatusHistoryTable).values({ order_id: orderId, status, comment });

    broadcastOrderUpdate(orderId, { type: "status", status });

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
    const { price } = req.body;
    const orderId = Number(req.params.id);

    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      return res.status(400).json({ error: "Некорректная сумма" });
    }

    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
    if (!order) return res.status(404).json({ error: "Заказ не найден" });

    let paymentLink: string | null = null;
    let confirmationUrl: string | null = null;

    if (isYookassaConfigured()) {
      try {
        const frontendUrl = process.env.FRONTEND_URL || "https://bruce3d-shop.ru";
        const returnUrl = `${frontendUrl.replace(/\/$/, "")}/order/${orderId}`;
        const payment = await createPayment({
          amount: Number(price),
          orderId,
          orderNumber: order.order_number,
          description: `Оплата заказа #${order.order_number} — BRUCE 3D SHOP`,
          returnUrl,
        });
        paymentLink = `yookassa:${payment.id}`;
        confirmationUrl = payment.confirmation?.confirmation_url || null;
      } catch (e: any) {
        console.error("[yookassa createPayment]", e);
        return res.status(502).json({ error: `Ошибка ЮКасса: ${e.message}` });
      }
    }

    await db.update(ordersTable).set({
      price: String(price),
      payment_link: paymentLink,
      status: "accepted",
      updated_at: new Date(),
    }).where(eq(ordersTable.id, orderId));

    await db.insert(orderStatusHistoryTable).values({
      order_id: orderId,
      status: "accepted",
      comment: `Выставлен счёт: ${price} ₽${isYookassaConfigured() ? " (ЮКасса)" : ""}`,
    });

    broadcastOrderUpdate(orderId, {
      type: "price",
      price,
      paymentUrl: confirmationUrl,
    });

    const msg = confirmationUrl
      ? `💰 <b>Счёт по заказу #${order.order_number}</b>\n\n💵 Сумма: <b>${price} ₽</b>\n\n🔗 <a href="${confirmationUrl}">Оплатить заказ</a>\n\nПосле оплаты заказ будет подтверждён автоматически.`
      : `💰 <b>Счёт по заказу #${order.order_number}</b>\n\n💵 Сумма: <b>${price} ₽</b>\n\nЗайдите в личный кабинет, чтобы подтвердить заказ.`;

    notifyClient(orderId, msg).catch(console.error);

    res.json({
      ok: true,
      paymentUrl: confirmationUrl,
      yookassaEnabled: isYookassaConfigured(),
    });
  } catch (e) {
    console.error("[admin/price]", e);
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
      totalSpent: sql<number>`(SELECT coalesce(sum(price::numeric), 0) FROM orders WHERE user_id = users.id AND status IN ('confirmed', 'completed'))`.as("totalSpent"),
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

// ===== BOT CONFIG =====
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

// ===== GALLERY URL MIGRATION =====
// Fixes existing gallery items with expired Telegram URLs — re-uploads to Cloudinary
router.post("/gallery/fix-urls", requireAdmin, async (_req, res) => {
  try {
    const { getTelegramFileUrl } = await import("../lib/telegram");
    const { uploadBuffer, isStorageConfigured } = await import("../lib/storage");

    if (!isStorageConfigured()) {
      return res.status(400).json({
        error: "Cloudinary не настроен. Добавьте CLOUDINARY_URL в переменные окружения Railway.",
      });
    }

    const allItems = await db.select().from(galleryItemsTable);
    const broken = allItems.filter(item => item.image_url?.includes("api.telegram.org"));

    if (broken.length === 0) {
      return res.json({ ok: true, fixed: 0, message: "Все фото уже имеют постоянные URL" });
    }

    const results: { id: number; title: string; status: string }[] = [];

    for (const item of broken) {
      try {
        if (!item.telegram_file_id) {
          results.push({ id: item.id, title: item.title || "", status: "skip — нет file_id" });
          continue;
        }

        const freshUrl = await getTelegramFileUrl(item.telegram_file_id);
        if (!freshUrl) {
          results.push({ id: item.id, title: item.title || "", status: "error — Telegram file not accessible" });
          continue;
        }

        const response = await fetch(freshUrl);
        if (!response.ok) {
          results.push({ id: item.id, title: item.title || "", status: `error — download failed (${response.status})` });
          continue;
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        const cloudUrl = await uploadBuffer(buffer, `gallery-${item.telegram_file_id}.jpg`, "image/jpeg", "gallery");

        await db.update(galleryItemsTable).set({ image_url: cloudUrl }).where(eq(galleryItemsTable.id, item.id));

        results.push({ id: item.id, title: item.title || "", status: "ok" });
        await new Promise(r => setTimeout(r, 300));
      } catch (e: any) {
        results.push({ id: item.id, title: item.title || "", status: `error — ${e.message}` });
      }
    }

    const fixed = results.filter(r => r.status === "ok").length;
    res.json({ ok: true, total: broken.length, fixed, failed: broken.length - fixed, results });
  } catch (e: any) {
    console.error("[admin/gallery/fix-urls]", e);
    res.status(500).json({ error: e.message });
  }
});

// Fix products that already have expired Telegram image URLs
router.post("/products/fix-image-urls", requireAdmin, async (_req, res) => {
  try {
    const { uploadBuffer, isStorageConfigured } = await import("../lib/storage");

    if (!isStorageConfigured()) {
      return res.status(400).json({ error: "Cloudinary не настроен" });
    }

    const allProducts = await db.select().from(productsTable);
    const broken = allProducts.filter(p => p.image_url?.includes("api.telegram.org"));

    if (broken.length === 0) {
      return res.json({ ok: true, fixed: 0, message: "Все товары уже имеют рабочие изображения" });
    }

    const results: { id: number; title: string; status: string }[] = [];

    for (const product of broken) {
      try {
        const response = await fetch(product.image_url!);
        if (!response.ok) {
          results.push({ id: product.id, title: product.title, status: `error — image expired (${response.status})` });
          continue;
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        const cloudUrl = await uploadBuffer(buffer, `product-${product.id}.jpg`, "image/jpeg", "products");
        await db.update(productsTable).set({ image_url: cloudUrl }).where(eq(productsTable.id, product.id));
        results.push({ id: product.id, title: product.title, status: "ok" });
        await new Promise(r => setTimeout(r, 300));
      } catch (e: any) {
        results.push({ id: product.id, title: product.title, status: `error — ${e.message}` });
      }
    }

    const fixed = results.filter(r => r.status === "ok").length;
    res.json({ ok: true, total: broken.length, fixed, results });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;

