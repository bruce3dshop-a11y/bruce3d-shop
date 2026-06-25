import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderStatusHistoryTable, usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser, isAdminSession } from "../lib/session";
import { sendTelegram, sendTelegramWithKeyboard, sendTelegramDocument, sendTelegramPhoto } from "../lib/telegram";
import { adminChatId } from "../lib/adminState";
import { getGroupChatId } from "../lib/configStore";
import multer from "multer";
import fs from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

const router = Router();

const serviceLabels: Record<string, string> = {
  "3d-print": "3D Печать", "3d-modeling": "Моделирование",
  "3d-scanning": "Сканирование", "repair": "Ремонт",
};

function generateOrderNumber() {
  return `B3D${Date.now().toString().slice(-6)}`;
}

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"]);

async function notifyTelegramNewOrder(order: {
  id: number; order_number: string; name: string; phone?: string | null;
  telegram?: string | null; email?: string | null;
  service_type: string; material: string; description: string; delivery_type?: string | null;
}, files?: { path: string; originalName: string; filename: string }[]) {
  const chatId = adminChatId;
  if (!chatId) return;

  const service = serviceLabels[order.service_type] || order.service_type;
  const contact = [
    order.phone && `📞 ${order.phone}`,
    order.telegram && `✈️ ${order.telegram}`,
    order.email && `✉️ ${order.email}`,
  ].filter(Boolean).join("\n");

  const fileCount = files?.length || 0;
  const fileNote = fileCount === 1
    ? `\n📎 Файл: <code>${files![0].originalName}</code>`
    : fileCount > 1
    ? `\n📎 Файлов: ${fileCount} (${files!.map(f => f.originalName).join(", ")})`
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

  if (files && files.length > 0) {
    for (const file of files) {
      if (!fs.existsSync(file.path)) continue;
      const ext = path.extname(file.originalName).toLowerCase();
      const caption = `📎 <b>Файл заказа #${order.order_number}</b>\n👤 ${order.name}\n<code>${file.originalName}</code>`;
      if (IMAGE_EXTS.has(ext)) {
        await sendTelegramPhoto(chatId, file.path, caption);
      } else {
        await sendTelegramDocument(chatId, file.path, caption);
      }
    }
  }
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

    const orderNumber = generateOrderNumber();
    const uploadedFiles = (req.files as Express.Multer.File[]) || [];

    const fileNamesJson = uploadedFiles.length > 0
      ? JSON.stringify(uploadedFiles.map(f => f.filename))
      : null;

    const [order] = await db.insert(ordersTable).values({
      order_number: orderNumber,
      user_id: userId,
      name, email, phone, telegram,
      service_type: serviceType,
      material,
      description,
      file_name: fileNamesJson || uploadedFiles[0]?.filename || null,
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

    const telegramFiles = uploadedFiles.map(f => ({
      path: path.join(UPLOAD_DIR, f.filename),
      originalName: f.originalname,
      filename: f.filename,
    }));
    notifyTelegramNewOrder(order, telegramFiles).catch(console.error);

    // Notify Telegram group (info-only, no keyboard)
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
      .orderBy(ordersTable.created_at);
    res.json({ orders: orders.reverse() });
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

    res.json({ order, history, messages: [] });
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

    await db.update(ordersTable).set({ status: "confirmed" }).where(eq(ordersTable.id, orderId));
    await db.insert(orderStatusHistoryTable).values({ order_id: orderId, status: "confirmed", comment: "Клиент подтвердил заказ" });

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to confirm order" });
  }
});

export { UPLOAD_DIR };
export default router;
