import { Router } from "express";
    import { db } from "@workspace/db";
    import { ordersTable, orderStatusHistoryTable, usersTable } from "@workspace/db/schema";
    import { eq, desc } from "drizzle-orm";
    import { getSessionUser, isAdminSession } from "../lib/session";
    import { sendTelegram, sendTelegramDocumentByUrl } from "../lib/telegram";
    import { adminChatId } from "../lib/adminState";
    import { getConfig, getGroupChatId } from "../lib/configStore";
    import { uploadBuffer, isStorageConfigured } from "../lib/storage";
    import { getPayment, isYookassaConfigured } from "../lib/yookassa";
    import { randomBytes } from "crypto";
    import multer from "multer";

    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 150 * 1024 * 1024 },
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
        delivery_city?: string | null; delivery_address?: string | null;
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

      const delivery = [
        order.delivery_type && order.delivery_type !== "pickup" && order.delivery_city && `🏙 ${order.delivery_city}`,
        order.delivery_address && `📍 ${order.delivery_address}`,
      ].filter(Boolean).join("\n") || "самовывоз";

      const fileCount = fileUrls?.length || 0;
      const fileNote = fileCount === 1
        ? `\n📎 Файл: <a href="${fileUrls![0].url}">${fileUrls![0].originalName}</a>`
        : fileCount > 1
        ? `\n📎 Файлов: ${fileCount}\n${fileUrls!.map(f => `• <a href="${f.url}">${f.originalName}</a>`).join("\n")}`
        : "";

      const siteUrl = getSiteUrl();
      const adminLink = siteUrl
        ? `\n\n🖥 <a href="${siteUrl}/admin">Открыть панель → Заказ #${order.order_number}</a>`
        : "";

      const text = `🆕 <b>Новый заказ #${order.order_number}</b>

    👤 <b>${order.name}</b>
    ${contact}

    🔧 Услуга: ${service}
    🧱 Материал: ${order.material.toUpperCase()}
    📦 Доставка: ${delivery}${fileNote}

    📝 ${order.description.slice(0, 500)}${order.description.length > 500 ? "..." : ""}${adminLink}`;

      await sendTelegram(chatId, text);
    }

    router.post("/", upload.array("files", 10), async (req, res) => {
      try {
        const body = req.body;
        const { name, email, phone, telegram, serviceType, material, description, deliveryType, deliveryCity, deliveryAddress, deliveryIndex } = body;
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

        const uploadedFiles = (req.files as Express.Multer.File[]) || [];
        const fileUrls: { url: string; originalName: string }[] = [...preUploadedUrls];

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

        notifyTelegramNewOrder({ ...order, delivery_city: deliveryCity, delivery_address: deliveryAddress }, fileUrls).catch(console.error);

        if (fileUrls.length > 0 && adminChatId) {
          const fileNotifyId = adminChatId;
          (async () => {
            for (const f of fileUrls) {
              try {
                const caption = `📎 Файл к заказу #${orderNumber}: <b>${f.originalName}</b>`;
                await sendTelegramDocumentByUrl(fileNotifyId, f.url, caption);
              } catch (e) { console.error("[order file to tg]", e); }
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

    // FIX: admin can confirm order (e.g., cash payment); regular user still requires YooKassa payment
    router.post("/:id/confirm", async (req, res) => {
      try {
        const user = await getSessionUser(req);
        const isAdmin = isAdminSession(req);
        if (!user && !isAdmin) return res.status(401).json({ error: "Unauthorized" });

        const orderId = Number(req.params.id);
        const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
        if (!order) return res.status(404).json({ error: "Заказ не найден" });
        if (!isAdmin && order.user_id !== user?.id) return res.status(403).json({ error: "Forbidden" });

        if (!order.price) {
          return res.status(400).json({ error: "Счёт ещё не выставлен" });
        }

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

    export default router;
  