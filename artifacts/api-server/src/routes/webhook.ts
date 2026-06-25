import { Router } from "express";
import {
  registerWebhook, getBotInfo, sendTelegram, sendTelegramWithKeyboard,
  answerCallbackQuery, editTelegramMessage, getTelegramFileUrl,
} from "../lib/telegram";
import { adminChatId, setAdminChatId } from "../lib/adminState";
import { getConfig, updateConfig } from "../lib/configStore";
import { isAdminSession } from "../lib/session";
import { db } from "@workspace/db";
import {
  ordersTable, orderStatusHistoryTable, reviewsTable,
  galleryItemsTable, usersTable,
} from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

const pendingInvoice: Map<string, number> = new Map();
const pendingPaymentLink: Map<string, { orderId: number; price: string }> = new Map();
const pendingBroadcast: Set<string> = new Set();

function orderKeyboard(orderId: number, status: string) {
  const rows: { text: string; callback_data: string }[][] = [];
  if (status === "new") {
    rows.push([
      { text: "✅ Принять", callback_data: `order_accept_${orderId}` },
      { text: "❌ Отклонить", callback_data: `order_reject_${orderId}` },
    ]);
  }
  if (["new", "accepted"].includes(status)) {
    rows.push([{ text: "💰 Выставить счёт", callback_data: `order_invoice_${orderId}` }]);
  }
  if (["accepted"].includes(status)) {
    rows.push([
      { text: "🔧 В работе", callback_data: `order_working_${orderId}` },
    ]);
  }
  if (["working"].includes(status)) {
    rows.push([{ text: "📦 Готов", callback_data: `order_ready_${orderId}` }]);
  }
  if (["ready"].includes(status)) {
    rows.push([
      { text: "🚚 Отправлен", callback_data: `order_shipped_${orderId}` },
      { text: "🎉 Завершён", callback_data: `order_completed_${orderId}` },
    ]);
  }
  return { inline_keyboard: rows };
}

async function updateOrderStatus(orderId: number, status: string, comment: string) {
  await db.update(ordersTable).set({ status, updated_at: new Date() }).where(eq(ordersTable.id, orderId));
  await db.insert(orderStatusHistoryTable).values({ order_id: orderId, status, comment });
}

async function notifyClientByOrder(orderId: number, message: string) {
  try {
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
    if (!order?.user_id) return;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, order.user_id)).limit(1);
    if (user?.telegram) await sendTelegram(user.telegram, message);
  } catch {}
}

function mainKeyboard() {
  return {
    keyboard: [
      [{ text: "📦 Заказы" }, { text: "📊 Статистика" }],
      [{ text: "👥 Клиенты" }, { text: "⭐ Отзывы" }],
      [{ text: "🖼 Галерея" }, { text: "📢 Рассылка" }],
      [{ text: "❓ Помощь" }],
    ],
    resize_keyboard: true,
    persistent: true,
  };
}

// ---- Get config (admin only) ----
router.get("/config", (req, res) => {
  if (!isAdminSession(req)) return res.status(401).json({ error: "Unauthorized" });
  const cfg = getConfig();
  res.json({
    botToken: cfg.botToken ? cfg.botToken.slice(0, 10) + "…" + cfg.botToken.slice(-4) : "",
    botTokenSet: !!cfg.botToken,
    adminChatId: cfg.adminChatId,
    webhookDomain: cfg.webhookDomain,
  });
});

// Auto-detect Replit domain
function getReplitDomain(): string {
  return process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS?.split(",")[0] || "";
}

// ---- Save config (admin only) ----
router.put("/config", async (req, res) => {
  if (!isAdminSession(req)) return res.status(401).json({ error: "Unauthorized" });
  const { botToken, adminChatId: chatId, webhookDomain } = req.body as {
    botToken?: string; adminChatId?: string; webhookDomain?: string;
  };
  const updates: Record<string, string> = {};
  if (botToken && botToken.trim()) updates.botToken = botToken.trim();
  if (chatId !== undefined) updates.adminChatId = chatId.trim();
  // Auto-detect domain from Replit env if not provided
  const domain = (webhookDomain && webhookDomain.trim()) || getReplitDomain();
  if (domain) updates.webhookDomain = domain;
  updateConfig(updates);
  // Also update in-memory adminChatId if changed
  if (updates.adminChatId !== undefined) {
    const { setAdminChatId } = await import("../lib/adminState");
    setAdminChatId(updates.adminChatId);
  }
  const bot = await getBotInfo();
  // Auto-register webhook when token is saved
  let webhookResult: { ok: boolean; description?: string } | null = null;
  if (updates.botToken && domain) {
    try {
      webhookResult = await registerWebhook(domain) as { ok: boolean; description?: string };
    } catch { /* non-fatal */ }
  }
  res.json({
    ok: true,
    botUsername: bot?.username,
    webhookRegistered: webhookResult?.ok ?? null,
    webhookUrl: domain ? `https://${domain}/api/webhook/telegram` : null,
  });
});

// ---- Register webhook ----
router.post("/register", async (req, res) => {
  const { domain: reqDomain } = req.body as { domain?: string };
  // Use provided domain, or auto-detect from Replit env
  const domain = (reqDomain && reqDomain.trim()) || getReplitDomain();
  if (!domain) return res.status(400).json({ error: "domain required (or REPLIT_DEV_DOMAIN not set)" });
  const { getBotToken } = await import("../lib/configStore");
  if (!getBotToken()) {
    return res.status(400).json({ error: "Bot token not configured. Save it in Telegram settings first." });
  }
  try {
    updateConfig({ webhookDomain: domain });
    const result = await registerWebhook(domain) as { ok: boolean; description?: string };
    const bot = await getBotInfo();
    res.json({
      ok: result.ok,
      webhookUrl: `https://${domain}/api/webhook/telegram`,
      botUsername: bot?.username,
      botName: bot?.first_name,
      description: result.description,
    });
  } catch {
    res.status(500).json({ error: "Failed to register webhook" });
  }
});

// ---- Status ----
router.get("/status", async (_req, res) => {
  const { getBotToken, getConfig } = await import("../lib/configStore");
  const cfg = getConfig();
  const bot = await getBotInfo();
  const domain = cfg.webhookDomain || getReplitDomain();
  res.json({
    botConfigured: !!getBotToken(),
    botUsername: bot?.username,
    botName: bot?.first_name,
    adminChatId: adminChatId ? `✅ ${adminChatId}` : "❌ не настроен",
    webhookDomain: domain,
    suggestedWebhookUrl: domain ? `https://${domain}/api/webhook/telegram` : null,
  });
});

// ---- Main webhook handler ----
router.post("/telegram", async (req, res) => {
  try {
    const body = req.body as {
      message?: {
        chat?: { id: number };
        text?: string;
        from?: { first_name?: string };
        photo?: { file_id: string }[];
        caption?: string;
        message_id?: number;
      };
      callback_query?: {
        id: string;
        from: { id: number };
        message?: { message_id: number; chat: { id: number }; text?: string };
        data?: string;
      };
    };

    // ---- CALLBACK QUERIES ----
    if (body.callback_query) {
      const cq = body.callback_query;
      const chatId = String(cq.from.id);
      const data = cq.data || "";
      const msgId = cq.message?.message_id;
      const prevText = cq.message?.text || "";

      if (chatId !== adminChatId) {
        await answerCallbackQuery(cq.id, "⛔ Доступ запрещён");
        return res.json({ ok: true });
      }

      // ---- Gallery delete ----
      if (data.startsWith("gallery_delete_")) {
        const id = Number(data.replace("gallery_delete_", ""));
        const deleted = await db.delete(galleryItemsTable).where(eq(galleryItemsTable.id, id)).returning();
        if (deleted.length) {
          await answerCallbackQuery(cq.id, "🗑 Удалено из галереи");
          if (msgId) await editTelegramMessage(chatId, msgId, prevText + "\n\n🗑 <b>УДАЛЕНО</b>");
        } else {
          await answerCallbackQuery(cq.id, "Фото не найдено");
        }

      // ---- Reviews ----
      } else if (data.startsWith("review_approve_")) {
        const id = Number(data.split("_").pop());
        await db.update(reviewsTable).set({ approved: true }).where(eq(reviewsTable.id, id));
        await answerCallbackQuery(cq.id, "✅ Опубликован!");
        if (msgId) await editTelegramMessage(chatId, msgId, prevText + "\n\n✅ <b>ОПУБЛИКОВАН</b>");

      } else if (data.startsWith("review_reject_")) {
        const id = Number(data.split("_").pop());
        await db.delete(reviewsTable).where(eq(reviewsTable.id, id));
        await answerCallbackQuery(cq.id, "🗑 Удалён");
        if (msgId) await editTelegramMessage(chatId, msgId, prevText + "\n\n❌ <b>УДАЛЁН</b>");

      // ---- Orders accept/reject ----
      } else if (data.startsWith("order_accept_")) {
        const orderId = Number(data.replace("order_accept_", ""));
        await updateOrderStatus(orderId, "accepted", "Принят администратором");
        const [o] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
        await answerCallbackQuery(cq.id, "✅ Заказ принят!");
        if (msgId && o) await editTelegramMessage(chatId, msgId, `✅ <b>Заказ #${o.order_number} принят в работу</b>`, orderKeyboard(orderId, "accepted"));
        await notifyClientByOrder(orderId, `✅ <b>Ваш заказ принят!</b>\n\nЗаказ <b>#${o?.order_number}</b> принят в работу. Вскоре с вами свяжутся.`);

      } else if (data.startsWith("order_reject_")) {
        const orderId = Number(data.replace("order_reject_", ""));
        await updateOrderStatus(orderId, "rejected", "Отклонён администратором");
        const [o] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
        await answerCallbackQuery(cq.id, "❌ Отклонён");
        if (msgId && o) await editTelegramMessage(chatId, msgId, `❌ <b>Заказ #${o.order_number} отклонён</b>`);
        await notifyClientByOrder(orderId, `❌ Ваш заказ <b>#${o?.order_number}</b> не может быть выполнен. Свяжитесь с нами для уточнения деталей.`);

      // ---- Invoice flow ----
      } else if (data.startsWith("order_invoice_")) {
        const orderId = Number(data.replace("order_invoice_", ""));
        pendingInvoice.set(chatId, orderId);
        await answerCallbackQuery(cq.id, "Введите сумму");
        const [o] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
        await sendTelegram(chatId, `💰 <b>Счёт для заказа #${o?.order_number || orderId}</b>\n\nВведите сумму в рублях, например: <code>1500</code>`);

      // ---- Status transitions ----
      } else if (data.startsWith("order_working_")) {
        const orderId = Number(data.replace("order_working_", ""));
        await updateOrderStatus(orderId, "working", "В производстве");
        const [o] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
        await answerCallbackQuery(cq.id, "🔧 В работе!");
        if (msgId && o) await editTelegramMessage(chatId, msgId, `🔧 <b>Заказ #${o.order_number} — В работе</b>`, orderKeyboard(orderId, "working"));
        await notifyClientByOrder(orderId, `🔧 <b>Заказ #${o?.order_number}</b> взят в производство!`);

      } else if (data.startsWith("order_ready_")) {
        const orderId = Number(data.replace("order_ready_", ""));
        await updateOrderStatus(orderId, "ready", "Готов к выдаче");
        const [o] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
        await answerCallbackQuery(cq.id, "📦 Готов!");
        if (msgId && o) await editTelegramMessage(chatId, msgId, `📦 <b>Заказ #${o.order_number} — Готов!</b>`, orderKeyboard(orderId, "ready"));
        await notifyClientByOrder(orderId, `📦 <b>Заказ #${o?.order_number} готов!</b> Ожидает выдачи или отправки.`);

      } else if (data.startsWith("order_shipped_")) {
        const orderId = Number(data.replace("order_shipped_", ""));
        await updateOrderStatus(orderId, "shipped", "Отправлен");
        const [o] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
        await answerCallbackQuery(cq.id, "🚚 Отправлен!");
        if (msgId && o) await editTelegramMessage(chatId, msgId, `🚚 <b>Заказ #${o.order_number} — Отправлен</b>`, orderKeyboard(orderId, "shipped"));
        await notifyClientByOrder(orderId, `🚚 <b>Заказ #${o?.order_number} отправлен!</b> Ожидайте доставки.`);

      } else if (data.startsWith("order_completed_")) {
        const orderId = Number(data.replace("order_completed_", ""));
        await updateOrderStatus(orderId, "completed", "Завершён");
        const [o] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
        await answerCallbackQuery(cq.id, "🎉 Завершён!");
        if (msgId && o) await editTelegramMessage(chatId, msgId, `🎉 <b>Заказ #${o.order_number} завершён!</b>`);
        await notifyClientByOrder(orderId, `🎉 <b>Заказ #${o?.order_number} завершён!</b> Спасибо за доверие к BRUCE 3D SHOP! Будем рады видеть вас снова.`);
      }

      return res.json({ ok: true });
    }

    // ---- TEXT MESSAGES ----
    const msg = body.message;
    if (!msg?.chat?.id) return res.json({ ok: true });

    const chatId = String(msg.chat.id);
    const text = (msg.text || "").trim();
    const firstName = msg.from?.first_name || "Пользователь";

    // /start — register admin
    if (text.startsWith("/start")) {
      setAdminChatId(chatId);
      await sendTelegramWithKeyboard(chatId,
        `✅ <b>Добро пожаловать, ${firstName}!</b>\n\nВы подключены как администратор <b>BRUCE 3D SHOP</b>.\n\nВсе уведомления о заказах, отзывах и файлах будут приходить сюда. 🚀\n\nОтправьте фото — оно сразу попадёт в Галерею на сайте!`,
        mainKeyboard()
      );
      return res.json({ ok: true });
    }

    // Access guard
    if (chatId !== adminChatId) {
      await sendTelegram(chatId, "⛔ Этот бот только для администратора BRUCE 3D SHOP.\n\nЕсли вы администратор — перейдите в настройки бота и зарегистрируйтесь.");
      return res.json({ ok: true });
    }

    // ---- Pending: invoice amount ----
    if (pendingInvoice.has(chatId)) {
      const orderId = pendingInvoice.get(chatId)!;
      const price = parseFloat(text.replace(",", "."));
      if (isNaN(price) || price <= 0) {
        await sendTelegram(chatId, "❌ Введите корректную сумму, например: <code>1500</code>");
        return res.json({ ok: true });
      }
      pendingInvoice.delete(chatId);
      pendingPaymentLink.set(chatId, { orderId, price: String(price) });
      await sendTelegram(chatId, `💰 Сумма: <b>${price} ₽</b>\n\nОтправьте ссылку на оплату (или напишите <code>нет</code> если без ссылки):`);
      return res.json({ ok: true });
    }

    // ---- Pending: payment link ----
    if (pendingPaymentLink.has(chatId)) {
      const { orderId, price } = pendingPaymentLink.get(chatId)!;
      pendingPaymentLink.delete(chatId);
      const paymentLink = text.toLowerCase() === "нет" ? null : text;
      await db.update(ordersTable).set({
        price, payment_link: paymentLink, status: "accepted", updated_at: new Date(),
      }).where(eq(ordersTable.id, orderId));
      await db.insert(orderStatusHistoryTable).values({
        order_id: orderId, status: "accepted",
        comment: `Счёт: ${price} ₽${paymentLink ? " | " + paymentLink : ""}`,
      });
      const [o] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
      await sendTelegram(chatId,
        `✅ Счёт выставлен для заказа <b>#${o?.order_number}</b>\n💵 ${price} ₽${paymentLink ? `\n🔗 ${paymentLink}` : ""}`
      );
      await notifyClientByOrder(orderId,
        `💰 <b>Счёт по заказу #${o?.order_number}</b>\n\n💵 Сумма: <b>${price} ₽</b>${paymentLink ? `\n🔗 Оплата: ${paymentLink}` : ""}\n\nЗайдите в личный кабинет чтобы подтвердить заказ.`
      );
      return res.json({ ok: true });
    }

    // ---- Pending: broadcast message ----
    if (pendingBroadcast.has(chatId)) {
      pendingBroadcast.delete(chatId);
      const users = await db.select({ telegram: usersTable.telegram }).from(usersTable);
      let sent = 0;
      for (const u of users) {
        if (u.telegram) {
          await sendTelegram(u.telegram, `📢 <b>BRUCE 3D SHOP</b>\n\n${text}`).catch(() => {});
          sent++;
          await new Promise(r => setTimeout(r, 60));
        }
      }
      await sendTelegram(chatId, `✅ Рассылка отправлена <b>${sent}</b> клиентам!`);
      return res.json({ ok: true });
    }

    // ---- Photo → Gallery ----
    if (msg.photo && msg.photo.length > 0) {
      const photo = msg.photo[msg.photo.length - 1];
      const fileUrl = await getTelegramFileUrl(photo.file_id);
      if (fileUrl) {
        const caption = msg.caption || "Работа BRUCE 3D SHOP";
        const [inserted] = await db.insert(galleryItemsTable).values({
          title: caption.slice(0, 100),
          image_url: fileUrl,
          telegram_file_id: photo.file_id,
          category: "3d-print",
        }).returning();
        await sendTelegramWithKeyboard(chatId,
          `✅ Фото добавлено в Галерею!\n📝 ${caption.slice(0, 80)}\n🆔 ID: ${inserted.id}`,
          { inline_keyboard: [[{ text: "🗑 Удалить из галереи", callback_data: `gallery_delete_${inserted.id}` }]] }
        );
      }
      return res.json({ ok: true });
    }

    // ---- Commands & keyboard buttons ----
    if (text === "/orders" || text === "📦 Заказы") {
      const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.created_at)).limit(10);
      const list = orders.map((o, i) =>
        `${i + 1}. <b>#${o.order_number}</b> — ${o.name}\n   ${statusEmoji(o.status)} ${o.status}${o.price ? ` · ${o.price} ₽` : ""}`
      ).join("\n\n");
      await sendTelegramWithKeyboard(chatId,
        `📦 <b>Последние 10 заказов:</b>\n\n${list || "Заказов нет"}`,
        mainKeyboard()
      );
    } else if (text === "/stats" || text === "📊 Статистика") {
      const allOrders = await db.select().from(ordersTable);
      const total = allOrders.length;
      const newCount = allOrders.filter(o => o.status === "new").length;
      const inWork = allOrders.filter(o => ["accepted", "working"].includes(o.status)).length;
      const revenue = allOrders.filter(o => ["confirmed", "completed"].includes(o.status))
        .reduce((s, o) => s + Number(o.price || 0), 0);
      const users = await db.select().from(usersTable);
      const pendingReviews = await db.select().from(reviewsTable).where(eq(reviewsTable.approved, false));
      await sendTelegramWithKeyboard(chatId,
        `📊 <b>Статистика BRUCE 3D SHOP</b>\n\n📦 Всего заказов: <b>${total}</b>\n🆕 Новых: <b>${newCount}</b>\n🔧 В работе: <b>${inWork}</b>\n💰 Выручка: <b>${revenue.toLocaleString("ru")} ₽</b>\n👥 Клиентов: <b>${users.length}</b>\n⭐ Отзывов на модерации: <b>${pendingReviews.length}</b>`,
        mainKeyboard()
      );
    } else if (text === "👥 Клиенты") {
      const users = await db.select().from(usersTable).orderBy(desc(usersTable.created_at)).limit(8);
      const list = users.map(u =>
        `👤 <b>${u.name}</b>${u.email ? ` — ${u.email}` : ""}${u.telegram ? ` · ${u.telegram}` : ""}${u.phone ? `\n   📞 ${u.phone}` : ""}`
      ).join("\n\n");
      await sendTelegramWithKeyboard(chatId, `👥 <b>Последние клиенты:</b>\n\n${list || "Нет клиентов"}`, mainKeyboard());
    } else if (text === "⭐ Отзывы") {
      const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.approved, false)).orderBy(desc(reviewsTable.created_at)).limit(5);
      if (reviews.length === 0) {
        await sendTelegramWithKeyboard(chatId, "⭐ Отзывов на модерации нет", mainKeyboard());
        return res.json({ ok: true });
      }
      for (const r of reviews) {
        const stars = "⭐".repeat(Math.min(r.rating || 5, 5));
        await sendTelegramWithKeyboard(chatId,
          `📝 <b>Отзыв #${r.id} — модерация</b>\n👤 ${r.name}${r.role ? ` · ${r.role}` : ""}\n${stars}\n\n"${r.text?.slice(0, 300)}"`,
          {
            inline_keyboard: [[
              { text: "✅ Опубликовать", callback_data: `review_approve_${r.id}` },
              { text: "❌ Удалить", callback_data: `review_reject_${r.id}` },
            ]],
          }
        );
      }
    } else if (text === "🖼 Галерея") {
      const galleryItems = await db.select().from(galleryItemsTable).orderBy(desc(galleryItemsTable.created_at)).limit(10);
      if (galleryItems.length === 0) {
        await sendTelegramWithKeyboard(chatId, "🖼 Галерея пуста. Отправьте фото чтобы добавить!", mainKeyboard());
        return res.json({ ok: true });
      }
      await sendTelegramWithKeyboard(chatId,
        `🖼 <b>Последние фото в галерее (${galleryItems.length}):</b>\n\nВыберите фото для удаления:`,
        mainKeyboard()
      );
      for (const item of galleryItems) {
        await sendTelegramWithKeyboard(chatId,
          `🖼 <b>${item.title || "Без названия"}</b>\n🆔 ID: ${item.id}${item.category ? `\n📁 ${item.category}` : ""}`,
          { inline_keyboard: [[{ text: "🗑 Удалить", callback_data: `gallery_delete_${item.id}` }]] }
        );
      }
    } else if (text === "📢 Рассылка") {
      pendingBroadcast.add(chatId);
      await sendTelegram(chatId, "📢 <b>Рассылка всем клиентам с Telegram</b>\n\nНапишите текст сообщения (будет отправлен от имени BRUCE 3D SHOP):");
    } else if (text === "/help" || text === "❓ Помощь") {
      await sendTelegramWithKeyboard(chatId,
        `🤖 <b>BRUCE 3D SHOP Bot</b>\n\n<b>Кнопки меню:</b>\n📦 Заказы — список последних 10 заказов\n📊 Статистика — сводка сайта\n👥 Клиенты — список клиентов\n⭐ Отзывы — модерация отзывов\n🖼 Галерея — список фото с кнопками удаления\n📢 Рассылка — сообщение всем клиентам\n\n<b>Автоматически:</b>\n🆕 Новый заказ — кнопки принять/отклонить/счёт\n📎 Файл заказа — получаете прямо в чат\n⭐ Новый отзыв — кнопки модерации\n\n<b>Галерея:</b>\n📸 Отправьте фото (с подписью) → сразу в Галерею!\n🗑 После загрузки — кнопка удалить\n🖼 Галерея — показать все фото с кнопками удаления\n\n<b>Управление статусами заказа:</b>\nВсе кнопки прямо в уведомлениях\n✅ Принять → 💰 Счёт → 🔧 В работе → 📦 Готов → 🚚 Отправлен → 🎉 Завершён\n\n<b>Команды:</b>\n/start — переподключиться\n/orders — заказы\n/stats — статистика`,
        mainKeyboard()
      );
    } else {
      await sendTelegramWithKeyboard(chatId,
        `Используйте кнопки меню ниже или /help для справки`,
        mainKeyboard()
      );
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error("Webhook error:", e);
    return res.json({ ok: true });
  }
});

function statusEmoji(s: string): string {
  const map: Record<string, string> = {
    new: "🆕", accepted: "✅", working: "🔧", ready: "📦",
    shipped: "🚚", completed: "🎉", rejected: "❌", confirmed: "💳",
  };
  return map[s] || "•";
}

export default router;
