import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderStatusHistoryTable, usersTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSessionUser, isAdminSession } from "../lib/session";
import { sendTelegram, sendTelegramWithKeyboard } from "../lib/telegram";
import { adminChatId } from "../lib/adminState";
import { getGroupChatId } from "../lib/configStore";
import { uploadBuffer, isStorageConfigured } from "../lib/storage";
import { getPayment, isYookassaConfigured } from "../lib/yookassa";
import { randomBytes } from "crypto";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const router = Router();

const serviceLabels: Record<string, string> = {
  "3d-print": "3D Печать",
  "3d-modeling": "Моделирование",
  "3d-scanning": "Сканирование",
  "repair": "Ремонт",
};

function generateOrderNumber() {
  return `B3D${randomBytes(3).toString("hex").toUpperCase()}`;
}

async function notifyTelegramNewOrder(
  order: {
    id: number; order_number: string; name: string; phone?: string | null;
    telegram?: string | null; email?: string | null;
    service_type: string; material: string; description: string; delivery_type?: string | null;
  },
  fileUrls?: { url: string; originalName: string }[]
) {
  const chatId = adminChatId;
  if (!chatId) return;

  const service = serviceLabels[order.service_type] || order.service_type;
  const contact = [
    order.phone && `📞 ${order.phone}`,
    order.telegram && `✈️ ${order.telegram}`,
    order.email && `✉️ ${order.email}`,
  ].filter(Boolean).join("\n");

  const fileCount = fileUrls?.length || 0;
  const fileNote = fileCount === 1
    ? `\n📎 Файл: <a href="${fileUrls![0].url}">${fileUrls![0].originalName}</a>`
    : fileCount > 1
    ? `\n📎 Файлов: ${fileCount}\n${fileUrls!.map(f => `• <a href="${f.url}">${f.originalName}</a>`).join("\n")}`
    : "";

  const text = `🆕 <b>Новый заказ #${order.order_number}</b>\n\n👤 <b>${order.name}</b>\n${contact}\n\n🔧 Услуга: ${service}\n🧱 Материал: ${order.material.toUpperCase()}\n📦 Доставка: ${order.delivery_type || "самовывоз"}${fileNote}\n\n📝 ${order.description.slice(0, 280)}${order.description.length > 280 ? "..." : ""}`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "✅ Принять", callback_data: `order_accept_${order.id}` },
        { text: "❌ Отклонить", callback_data: `order_reject_${order.id}` },
      ],
      [{ text: "💰 Выставить счёт", callback_data: `order_invoice_${order.id}` }],
    ],
  };

  await sendTelegramWithKeyboard(chatId, text, keyboard);
}

router.post("/", upload.array("files", 10), async (req, res) => {
  try {
    const body = req.body;
    const { name, email, phone, telegram, serviceType, material, description, deliveryType, deliveryCity, deliveryAddress, deliveryIndex } = body;
    if (!name || !serviceType || !material || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let userId: number | undefined;
    if (email) {
      let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
      if (!user) {
        [user] = await db.insert(usersTable).values({ name, email, phone, telegram }).returning();
      }
      userId = user.id;
    }

    const uploadedFiles = (req.files as Express.Multer.File[]) || [];
    const fileUrls: { url: string; originalName: string }[] = [];

    if (uploadedFiles.length > 0 && isStorageConfigured()) {
      for (const file of uploadedFiles) {
        try {
          const url = await uploadBuffer(file.buffer, file.originalname, file.mimetype, "orders");
          fileUrls.push({ url, originalName: file.originalname });
        } catch (e) {
          console.error("[order upload]", e);
        }
      }
    }

    const fileNamesJson = fileUrls.length > 0
      ? JSON.stringify(fileUrls.map(f => f.url))
      : uploadedFiles.length > 0
      ? JSON.stringify(uploadedFiles.map(f => f.originalname))
      : null;

    let orderNumber: string;
    let attempts = 0;
    while (true) {
      orderNumber = generateOrderNumber();
      const [existing] = await db.select({ id: ordersTable.id }).from(ordersTable)
        .where(eq(ordersTable.order_number, orderNumber)).limit(1);
      if (!existing) break;
      if (++attempts > 10) throw new Error("Failed to generate unique order number");
    }

    const [order] = await db.insert(ordersTable).values({
      order_number: orderNumber!,
      user_id: userId,
      name, email, phone, telegram,
      service_type: serviceType,
      material,
      description,
      file_name: fileNamesJson || uploadedFiles[0]?.originalname || null,
      delivery_type: deliveryType || "pickup",
      delivery_city: deliveryCity,
      delivery_address: deliveryAddress,
      delivery_index: deliveryIndex,
      status: "new",
    }).returning();

    await db.insert(orderStatusHistoryTable).values({
      order_id: order.id,
      status: "new",
      comment: "Заказ создан",
    });

    notifyTelegramNewOrder(order, fileUrls).catch(console.error);

    const groupId = getGroupChatId();
    if (groupId) {
      const service = serviceLabels[order.service_type] || order.service_type;
      const groupText = `🆕 <b>Заказ #${order.order_number}</b>\n👤 ${order.name}\n🔧 ${service} · ${order.material.toUpperCase()}\n📦 ${order.delivery_type || "самовывоз"}\n📝 ${order.description.slice(0, 150)}${order.description.length > 150 ? "..." : ""}`;
      sendTelegram(groupId, groupText).catch(console.error);
    }

    res.json({ ok: true, orderId: order.id, orderNumber: order.order_number });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create order" });
  }
});

router.get("/my", async (req, res) => {
  try {
    const user = await getSessionUser(req);
    if (!user) return res.json({ orders: [] });
    const orders = await db.select().from(ordersTable)
      .where(eq(ordersTable.user_id, user.id))
      .orderBy(desc(ordersTable.created_at));
    const cleaned = orders.map(o => ({
      ...o,
      payment_link: o.payment_link?.startsWith("yookassa:") ? null : o.payment_link,
    }));
    res.json({ orders: cleaned });
  } catch {
    res.status(500).json({ error: "Failed to get orders" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const user = await getSessionUser(req);
    const isAdmin = isAdminSession(req);
    if (!user && !isAdmin) return res.status(401).json({ error: "Unauthorized" });

    const [order] = await db.select().from(ordersTable)
      .where(eq(ordersTable.id, Number(req.params.id))).limit(1);

    if (!order) return res.status(404).json({ error: "Not found" });
    if (!isAdmin && order.user_id !== user?.id) return res.status(403).json({ error: "Forbidden" });

    const history = await db.select().from(orderStatusHistoryTable)
      .where(eq(orderStatusHistoryTable.order_id, order.id))
      .orderBy(orderStatusHistoryTable.created_at);

    let paymentUrl: string | null = null;
    let paymentPaid = false;

    if (order.payment_link?.startsWith("yookassa:") && isYookassaConfigured()) {
      const paymentId = order.payment_link.replace("yookassa:", "");
      try {
        const payment = await getPayment(paymentId);
        paymentPaid = payment.paid;
        if (!payment.paid && payment.status !== "canceled") {
          paymentUrl = payment.confirmation?.confirmation_url || null;
        }
      } catch (e) {
        console.error("[orders/:id] getPayment error", e);
      }
    } else if (order.payment_link && !order.payment_link.startsWith("yookassa:")) {
      paymentUrl = order.payment_link;
    }

    res.json({ order: { ...order, payment_link: paymentUrl }, paymentPaid, history, messages: [] });
  } catch {
    res.status(500).json({ error: "Failed to get order" });
  }
});

router.get("/track/:orderNumber", async (req, res) => {
  try {
    const [order] = await db.select({
      id: ordersTable.id,
      order_number: ordersTable.order_number,
      status: ordersTable.status,
      service_type: ordersTable.service_type,
      material: ordersTable.material,
      created_at: ordersTable.created_at,
      updated_at: ordersTable.updated_at,
    }).from(ordersTable).where(eq(ordersTable.order_number, req.params.orderNumber)).limit(1);

    if (!order) return res.status(404).json({ error: "Not found" });

    const history = await db.select().from(orderStatusHistoryTable)
      .where(eq(orderStatusHistoryTable.order_id, order.id));

    res.json({ ...order, history });
  } catch {
    res.status(500).json({ error: "DB error" });
  }
});

router.post("/:id/confirm", async (req, res) => {
  try {
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const orderId = Number(req.params.id);
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
    if (!order || order.user_id !== user.id) return res.status(403).json({ error: "Forbidden" });

    if (!order.price) {
      return res.status(400).json({ error: "Счёт ещё не выставлен" });
    }

    if (order.payment_link?.startsWith("yookassa:") && isYookassaConfigured()) {
      const paymentId = order.payment_link.replace("yookassa:", "");
      const payment = await getPayment(paymentId);
      if (!payment.paid || payment.status !== "succeeded") {
        return res.status(402).json({
          error: "Заказ не может быть подтверждён до оплаты",
          paymentRequired: true,
          paymentUrl: payment.confirmation?.confirmation_url || null,
        });
      }
    }

    await db.update(ordersTable).set({ status: "confirmed" }).where(eq(ordersTable.id, orderId));
    await db.insert(orderStatusHistoryTable).values({
      order_id: orderId,
      status: "confirmed",
      comment: "Клиент подтвердил заказ",
    });

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to confirm order" });
  }
});

export default router;
