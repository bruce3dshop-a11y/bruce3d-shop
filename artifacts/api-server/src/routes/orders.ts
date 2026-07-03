import { Router } from "express";
    import { db } from "@workspace/db";
    import { ordersTable, orderStatusHistoryTable, usersTable } from "@workspace/db/schema";
    import { eq, desc } from "drizzle-orm";
    import { getSessionUser, isAdminSession } from "../lib/session";
    import { sendTelegram, sendTelegramDocumentByUrl, sendTelegramDocumentBuffer } from "../lib/telegram";
    import { adminChatId } from "../lib/adminState";
    import { getConfig, getGroupChatId } from "../lib/configStore";
    import { uploadBuffer, isStorageConfigured } from "../lib/storage";
    import { getPayment, isYookassaConfigured } from "../lib/yookassa";
import { broadcastOrderUpdate } from "./chat";
    import { randomBytes } from "crypto";
    import busboy from "busboy";
    import type { IncomingMessage } from "http";

    const MAX_FILE_SIZE = 150 * 1024 * 1024; // 150 МБ
    const MAX_FILES = 10;

    interface ParsedFile {
      fieldname: string;
      originalname: string;
      buffer: Buffer;
      mimetype: string;
      size: number;
    }

    interface ParsedForm {
      fields: Record<string, string>;
      files: ParsedFile[];
    }

    /** Парсим multipart/form-data вручную через busboy.
     *  multer@1.x несовместим с Express 5 при обработке файловых стримов. */
    function parseMultipart(req: IncomingMessage): Promise<ParsedForm> {
      return new Promise((resolve, reject) => {
        const fields: Record<string, string> = {};
        const files: ParsedFile[] = [];

        const bb = busboy({
          headers: req.headers as Record<string, string>,
          limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
        });

        bb.on("field", (name, value) => {
          fields[name] = value;
        });

        bb.on("file", (fieldname, stream, info) => {
          const chunks: Buffer[] = [];
          stream.on("data", (chunk: Buffer) => chunks.push(chunk));
          stream.on("end", () => {
            const buffer = Buffer.concat(chunks);
            files.push({
              fieldname,
              originalname: info.filename ?? "file",
              buffer,
              mimetype: info.mimeType ?? "application/octet-stream",
              size: buffer.length,
            });
          });
          stream.on("error", reject);
        });

        bb.on("finish", () => resolve({ fields, files }));
        bb.on("error", reject);

        req.pipe(bb);
      });
    }

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

    function getSiteUrl(): string {
      return (
        process.env.FRONTEND_URL?.replace(/\/$/, "") ||
        (getConfig().webhookDomain ? `https://${getConfig().webhookDomain}` : "") ||
        ""
      );
    }

    async function notifyTelegramNewOrder(
      order: {
        id: number; order_number: string; name: string; phone?: string | null;
        telegram?: string | null; email?: string | null;
        service_type: string; material: string; description: string; delivery_type?: string | null;
        delivery_city?: string | null; delivery_address?: string | null; delivery_index?: string | null;
        delivery_full_name?: string | null; delivery_phone?: string | null;
      },
      fileUrls?: { url: string; originalName: string }[],
      rawFileCount?: number
    ) {
      const chatId = adminChatId;
      if (!chatId) return;

      const service = serviceLabels[order.service_type] || order.service_type;
      const contact = [
        order.phone && `📞 ${order.phone}`,
        order.telegram && `✈️ ${order.telegram}`,
        order.email && `✉️ ${order.email}`,
      ].filter(Boolean).join("\n");

      const deliveryTypeLabel: Record<string, string> = {
        pickup: "🏠 Самовывоз", cdek: "📦 СДЭК", post: "✉️ Почта России", courier: "🚗 Курьер",
      };
      const deliveryLine = order.delivery_type === "pickup"
        ? "🏠 Самовывоз"
        : [
          deliveryTypeLabel[order.delivery_type ?? ""] || (order.delivery_type ? `📦 ${order.delivery_type}` : null),
          order.delivery_full_name && `👤 ${order.delivery_full_name}`,
          order.delivery_phone && `📞 ${order.delivery_phone}`,
          order.delivery_city && `🏙 ${order.delivery_city}`,
          order.delivery_address && `📍 ${order.delivery_address}`,
          order.delivery_index && `📮 ${order.delivery_index}`,
        ].filter(Boolean).join("\n") || "🏠 Самовывоз";

      const fileCount = fileUrls?.length || 0;
      const fileNote = fileCount === 1
        ? `\n\n📎 Файл: <a href="${fileUrls![0].url}">${fileUrls![0].originalName}</a>`
        : fileCount > 1
        ? `\n\n📎 Файлов: ${fileCount}\n${fileUrls!.map(f => `• <a href="${f.url}">${f.originalName}</a>`).join("\n")}`
        : rawFileCount && rawFileCount > 0
        ? `\n\n📎 Файлов: ${rawFileCount} (прикреплены следующими сообщениями)`
        : "";

      const siteUrl = getSiteUrl();
      const adminLink = siteUrl
        ? `\n\n🖥 <a href="${siteUrl}/admin">Открыть панель → Заказ #${order.order_number}</a>`
        : "";

      const sep = "━━━━━━━━━━━━━━━━━━";
      const text = `🆕 <b>Новый заказ #${order.order_number}</b>

👤 <b>${order.name}</b>
${contact}
${sep}
🔧 <b>Услуга:</b> ${service}
🧱 <b>Материал:</b> ${order.material.toUpperCase()}
${deliveryLine}
${sep}
📝 <b>Описание:</b>
${order.description.slice(0, 800)}${order.description.length > 800 ? "..." : ""}${fileNote}
${sep}${adminLink}`;

      await sendTelegram(chatId, text);
    }

    router.post("/", async (req, res) => {
      try {
        // Парсим multipart через busboy (multer@1.x несовместим с Express 5)
        const { fields, files: uploadedFiles } = await parseMultipart(req);
        const body = fields;
        const { name, email, phone, telegram, serviceType, material, description, deliveryType, deliveryCity, deliveryAddress, deliveryIndex, deliveryFullName, deliveryPhone } = body;
        if (!name || !serviceType || !material || !description) {
          return res.status(400).json({ error: "Missing required fields" });
        }
        if (name.length > 200) return res.status(400).json({ error: "Имя слишком длинное (макс. 200 символов)" });
        if (description.length > 5000) return res.status(400).json({ error: "Описание слишком длинное (макс. 5000 символов)" });
        if (deliveryAddress && String(deliveryAddress).length > 500) return res.status(400).json({ error: "Адрес слишком длинный (макс. 500 символов)" });

        let userId: number | undefined;
        if (email) {
          let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
          if (!user) {
            [user] = await db.insert(usersTable).values({ name, email, phone, telegram }).returning();
          }
          userId = user.id;
        }

        const preUploadedUrls: { url: string; originalName: string }[] = [];
        if (body.fileUrls) {
          try {
            const parsed = JSON.parse(body.fileUrls);
            if (Array.isArray(parsed)) {
              for (const item of parsed) {
                if (typeof item === "string") preUploadedUrls.push({ url: item, originalName: item.split("/").pop() || "file" });
                else if (item?.url) preUploadedUrls.push({ url: item.url, originalName: item.originalName || item.url.split("/").pop() || "file" });
              }
            }
          } catch {}
        }
        const fileUrls: { url: string; originalName: string }[] = [...preUploadedUrls];

        // Upload to Cloudinary if configured and no pre-uploaded URLs
        if (uploadedFiles.length > 0 && isStorageConfigured() && preUploadedUrls.length === 0) {
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
          ? JSON.stringify(fileUrls.map(f => ({ url: f.url, name: f.originalName })))
          : uploadedFiles.length > 0
          ? JSON.stringify(uploadedFiles.map(f => ({ url: f.originalname, name: f.originalname })))
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
          delivery_full_name: deliveryFullName || null,
          delivery_phone: deliveryPhone || null,
          status: "new",
        }).returning();

        await db.insert(orderStatusHistoryTable).values({
          order_id: order.id,
          status: "new",
          comment: "Заказ создан",
        });

        // Notify Telegram — include raw file count if they'll be sent as separate messages
        const rawFilesToSend = uploadedFiles.length > 0 && fileUrls.length === 0 ? uploadedFiles : [];
        notifyTelegramNewOrder(
          { ...order, delivery_city: deliveryCity, delivery_address: deliveryAddress, delivery_full_name: deliveryFullName || null, delivery_phone: deliveryPhone || null },
          fileUrls,
          rawFilesToSend.length
        ).catch(console.error);

        // Send files to Telegram admin
        if (adminChatId) {
          (async () => {
            // Case 1: Files uploaded to Cloudinary — send by URL
            if (fileUrls.length > 0) {
              for (const f of fileUrls) {
                try {
                  const caption = `📎 Файл к заказу #${orderNumber}: <b>${f.originalName}</b>`;
                  await sendTelegramDocumentByUrl(adminChatId, f.url, caption);
                } catch (e) { console.error("[order file url to tg]", e); }
              }
            }
            // Case 2: No Cloudinary — send raw buffers directly to Telegram
            else if (rawFilesToSend.length > 0) {
              for (const file of rawFilesToSend) {
                try {
                  const caption = `📎 Файл к заказу #${orderNumber}: <b>${file.originalname}</b>`;
                  await sendTelegramDocumentBuffer(adminChatId, file.buffer, file.originalname, caption);
                } catch (e) { console.error("[order file buf to tg]", e); }
              }
            }
          })().catch(console.error);
        }

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

    // FIX: correct paymentId parsing (stored as "yookassa:{id}|{url}", must use only the id part)
    router.get("/:id", async (req, res) => {
      try {
        const user = await getSessionUser(req);
        const isAdmin = isAdminSession(req);
        if (!user && !isAdmin) return res.status(401).json({ error: "Unauthorized" });

        let [order] = await db.select().from(ordersTable)
          .where(eq(ordersTable.id, Number(req.params.id))).limit(1);

        if (!order) return res.status(404).json({ error: "Not found" });
        if (!isAdmin && order.user_id !== user?.id) return res.status(403).json({ error: "Forbidden" });

        const history = await db.select().from(orderStatusHistoryTable)
          .where(eq(orderStatusHistoryTable.order_id, order.id))
          .orderBy(orderStatusHistoryTable.created_at);

        let paymentUrl: string | null = null;
        let paymentPaid = false;

        if (order.payment_link?.startsWith("yookassa:") && isYookassaConfigured()) {
          const raw = order.payment_link.slice("yookassa:".length);
          const paymentId = raw.split("|")[0];
          const storedUrl = raw.split("|")[1] || "";
          try {
            const payment = await getPayment(paymentId);
            paymentPaid = payment.paid;
            if (!payment.paid && payment.status !== "canceled") {
              paymentUrl = storedUrl.startsWith("http")
                ? storedUrl
                : (payment.confirmation?.confirmation_url || null);
            }
            // Auto-confirm: if YooKassa says paid but our status is behind
            if (payment.paid && order.status !== "confirmed") {
              await db.update(ordersTable)
                .set({ status: "confirmed", updated_at: new Date() })
                .where(eq(ordersTable.id, order.id));
              await db.insert(orderStatusHistoryTable).values({
                order_id: order.id,
                status: "confirmed",
                comment: `Автоподтверждение: оплачено через ЮКасса (платёж ${paymentId})`,
              });
              order = { ...order, status: "confirmed" };
              broadcastOrderUpdate(order.id, { type: "status", status: "confirmed" });
            }
          } catch (e) {
            console.error("[orders/:id] getPayment error", e);
            if (storedUrl.startsWith("http")) paymentUrl = storedUrl;
          }
        } else if (order.payment_link && !order.payment_link.startsWith("yookassa:")) {
          paymentUrl = order.payment_link;
        }

        res.json({ order: { ...order, payment_link: paymentUrl }, paymentPaid, history, messages: [] });
      } catch (e) {
        console.error("[orders/:id]", e);
        res.status(500).json({ error: "Server error" });
      }
    });

    router.post("/:id/confirm", async (req, res) => {
      try {
        const orderId = Number(req.params.id);
        if (!orderId) return res.status(400).json({ error: "Invalid order id" });

        const sessionUser = await getSessionUser(req);
        const isAdmin = isAdminSession(req);
        if (!sessionUser && !isAdmin) return res.status(401).json({ error: "Не авторизован" });

        const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
        if (!order) return res.status(404).json({ error: "Заказ не найден" });
        if (!isAdmin && order.user_id !== sessionUser?.id) return res.status(403).json({ error: "Нет доступа" });

        if (!isAdmin && order.payment_link?.startsWith("yookassa:") && isYookassaConfigured()) {
          const raw = order.payment_link.slice("yookassa:".length);
          const paymentId = raw.split("|")[0];
          const payment = await getPayment(paymentId);
          if (!payment.paid || payment.status !== "succeeded") {
            return res.status(402).json({
              error: "Заказ не может быть подтверждён до оплаты",
              paymentRequired: true,
              paymentUrl: payment.confirmation?.confirmation_url || null,
            });
          }
        }

        await db.update(ordersTable).set({ status: "confirmed", updated_at: new Date() }).where(eq(ordersTable.id, orderId));
        await db.insert(orderStatusHistoryTable).values({
          order_id: orderId,
          status: "confirmed",
          comment: isAdmin ? "Подтверждено администратором" : "Клиент подтвердил заказ",
        });

        res.json({ ok: true });
      } catch (e) {
        console.error("[orders/confirm]", e);
        res.status(500).json({ error: "Failed to confirm order" });
      }
    });

    router.post("/:id/cancel", async (req, res) => {
        try {
          const orderId = Number(req.params.id);
          if (!orderId) return res.status(400).json({ error: "Invalid order id" });
          const sessionUser = await getSessionUser(req);
          const adminAccess = isAdminSession(req);
          if (!sessionUser && !adminAccess) return res.status(401).json({ error: "Не авторизован" });
          const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
          if (!order) return res.status(404).json({ error: "Заказ не найден" });
          if (!adminAccess && order.user_id !== sessionUser?.id) return res.status(403).json({ error: "Нет доступа" });
          const cancellable = ["new", "accepted", "calculating"];
          if (!cancellable.includes(order.status)) return res.status(409).json({ error: "Заказ нельзя отменить на этом этапе (" + order.status + ")" });
          await db.update(ordersTable).set({ status: "cancelled", updated_at: new Date() }).where(eq(ordersTable.id, orderId));
          await db.insert(orderStatusHistoryTable).values({ order_id: orderId, status: "cancelled", comment: adminAccess ? "Отменён администратором" : "Клиент отменил заказ" });
          res.json({ ok: true });
        } catch (e) {
          console.error("[orders/cancel]", e);
          res.status(500).json({ error: "Ошибка отмены заказа" });
        }
      });

      export default router;
