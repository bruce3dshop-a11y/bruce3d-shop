import { Router } from "express";
  import {
    registerWebhook, getBotInfo, sendTelegram, sendTelegramWithKeyboard,
    answerCallbackQuery, editTelegramMessage, getTelegramFileUrl,
  } from "../lib/telegram";
  import { adminChatId, setAdminChatId } from "../lib/adminState";
  import { getConfig, updateConfig } from "../lib/configStore";
  import { isAdminSession } from "../lib/session";
  import { uploadBuffer, isStorageConfigured } from "../lib/storage";
  import { db } from "@workspace/db";
  import {
    ordersTable, reviewsTable,
    galleryItemsTable, usersTable,
  } from "@workspace/db/schema";
  import { eq, desc } from "drizzle-orm";

  const router = Router();

  const pendingBroadcast: Set<string> = new Set();

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
    const domain = (webhookDomain && webhookDomain.trim()) || getReplitDomain();
    if (domain) updates.webhookDomain = domain;
    updateConfig(updates);
    if (updates.adminChatId !== undefined) {
      const { setAdminChatId } = await import("../lib/adminState");
      setAdminChatId(updates.adminChatId);
    }
    const bot = await getBotInfo();
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

  function statusEmoji(status: string) {
    const map: Record<string, string> = {
      new: "🆕", accepted: "✅", working: "🔧", printing: "🖨", postprocess: "✨",
      ready: "📦", shipped: "🚚", completed: "🎉", confirmed: "💚", rejected: "❌",
    };
    return map[status] || "❓";
  }

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

        } else {
          await answerCallbackQuery(cq.id, "");
        }

        return res.json({ ok: true });
      }

      // ---- TEXT MESSAGES ----
      const msg = body.message;
      if (!msg?.chat?.id) return res.json({ ok: true });

      const chatId = String(msg.chat.id);
      const text = (msg.text || "").trim();
      const firstName = msg.from?.first_name || "Пользователь";

      // /start — register admin (PROTECTED: only if no admin set, or already the same admin)
      if (text.startsWith("/start")) {
        if (adminChatId && chatId !== adminChatId) {
          await sendTelegram(chatId, "⛔ Этот бот уже настроен для другого администратора.\n\nЕсли вы владелец бота — зайдите в панель администратора и сбросьте настройки.");
          return res.json({ ok: true });
        }
        setAdminChatId(chatId);
        await sendTelegramWithKeyboard(chatId,
          `✅ <b>Добро пожаловать, ${firstName}!</b>\n\nВы подключены как администратор <b>BRUCE 3D SHOP</b>.\n\nВсе уведомления о заказах, отзывах и файлах будут приходить сюда. 🚀\n\nОтправьте фото — оно сразу попадёт в Галерею на сайте!\n\n🖥 Управление заказами — в панели администратора на сайте.`,
          mainKeyboard()
        );
        return res.json({ ok: true });
      }

      // Access guard
      if (chatId !== adminChatId) {
        await sendTelegram(chatId, "⛔ Этот бот только для администратора BRUCE 3D SHOP.\n\nЕсли вы администратор — перейдите в настройки бота и зарегистрируйтесь.");
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

      // ---- Photo → Gallery (with Cloudinary re-upload for permanent URLs) ----
      if (msg.photo && msg.photo.length > 0) {
        const photo = msg.photo[msg.photo.length - 1];
        const telegramFileUrl = await getTelegramFileUrl(photo.file_id);
        if (telegramFileUrl) {
          const caption = msg.caption || "Работа BRUCE 3D SHOP";
          let imageUrl = telegramFileUrl;

          // Re-upload to Cloudinary for a permanent URL (Telegram URLs expire)
          if (isStorageConfigured()) {
            try {
              const response = await fetch(telegramFileUrl);
              const buffer = Buffer.from(await response.arrayBuffer());
              imageUrl = await uploadBuffer(buffer, `gallery-${photo.file_id}.jpg`, "image/jpeg", "gallery");
              console.log(`[gallery] Uploaded to Cloudinary: ${imageUrl}`);
            } catch (e) {
              console.error("[gallery] Cloudinary upload failed, falling back to Telegram URL:", e);
            }
          }

          const [inserted] = await db.insert(galleryItemsTable).values({
            title: caption.slice(0, 100),
            image_url: imageUrl,
            telegram_file_id: photo.file_id,
            category: "3d-print",
          }).returning();

          const isCloudinary = imageUrl.includes("cloudinary.com");
          await sendTelegramWithKeyboard(chatId,
            `✅ Фото добавлено в Галерею!\n📝 ${caption.slice(0, 80)}\n🆔 ID: ${inserted.id}${isCloudinary ? "\n☁️ Сохранено в Cloudinary (постоянная ссылка)" : "\n⚠️ Временная ссылка Telegram (настройте Cloudinary для постоянных URL)"}`,
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
          `📦 <b>Последние 10 заказов:</b>\n\n${list || "Заказов нет"}\n\n🖥 Для управления заказами — откройте панель администратора на сайте.`,
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
        const pendingReviewsList = await db.select().from(reviewsTable).where(eq(reviewsTable.approved, false));
        await sendTelegramWithKeyboard(chatId,
          `📊 <b>Статистика BRUCE 3D SHOP</b>\n\n📦 Всего заказов: <b>${total}</b>\n🆕 Новых: <b>${newCount}</b>\n🔧 В работе: <b>${inWork}</b>\n💰 Выручка: <b>${revenue.toLocaleString("ru")} ₽</b>\n👥 Клиентов: <b>${users.length}</b>\n⭐ Отзывов на модерации: <b>${pendingReviewsList.length}</b>`,
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
          `🤖 <b>BRUCE 3D SHOP Bot</b>\n\n<b>Кнопки меню:</b>\n📦 Заказы — список последних 10 заказов\n📊 Статистика — сводка сайта\n👥 Клиенты — список клиентов\n⭐ Отзывы — модерация отзывов\n🖼 Галерея — список фото с кнопками удаления\n📢 Рассылка — сообщение всем клиентам\n\n<b>Автоматически:</b>\n🆕 Новый заказ — анкета с данными клиента и файлом\n⭐ Новый отзыв — кнопки модерации\n\n<b>Галерея:</b>\n📸 Отправьте фото (с подписью) → сразу в Галерею!\n🗑 После загрузки — кнопка удалить\n\n<b>Управление заказами:</b>\n🖥 Принять, отклонить, выставить счёт и менять статусы — только на сайте в панели администратора.`,
          mainKeyboard()
        );
      }

      return res.json({ ok: true });
    } catch (e) {
      console.error("[webhook/telegram]", e);
      return res.status(500).json({ ok: false });
    }
  });

  export default router;
  