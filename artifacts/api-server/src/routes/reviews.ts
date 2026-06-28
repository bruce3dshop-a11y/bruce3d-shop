import { Router } from "express";
import rateLimit from "express-rate-limit";

const reviewRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Слишком много запросов. Попробуйте позже." },
});
import { db } from "@workspace/db";
import { reviewsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { sendTelegramWithKeyboard } from "../lib/telegram";
import { adminChatId } from "../lib/adminState";
import { isAdminSession } from "../lib/session";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const reviews = await db.select().from(reviewsTable)
      .where(eq(reviewsTable.approved, true))
      .orderBy(reviewsTable.created_at);
    res.json({ reviews: reviews.reverse() });
  } catch {
    res.status(500).json({ error: "Failed to get reviews" });
  }
});

router.post("/", reviewRateLimit, async (req, res) => {
  try {
    const { name, role, rating, text } = req.body;
    if (!name || !text) return res.status(400).json({ error: "name and text required" });
    if (name.length > 100) return res.status(400).json({ error: "Имя слишком длинное (макс. 100 символов)" });
    if (text.length > 2000) return res.status(400).json({ error: "Текст слишком длинный (макс. 2000 символов)" });
    const safeRating = Math.min(5, Math.max(1, Number(rating) || 5));

    const [review] = await db.insert(reviewsTable).values({
      name: name.slice(0, 100), role: role?.slice(0, 100), rating: safeRating, text: text.slice(0, 2000), approved: false,
    }).returning();

    const chatId = adminChatId;
    if (chatId) {
      const stars = "⭐".repeat(Math.min(review.rating || 5, 5));
      const msg = `📝 <b>Новый отзыв на модерацию</b>\n\n👤 <b>${name}</b>${role ? ` — ${role}` : ""}\n${stars}\n\n"${text.slice(0, 400)}"`;
      await sendTelegramWithKeyboard(chatId, msg, {
        inline_keyboard: [[
          { text: "✅ Опубликовать", callback_data: `review_approve_${review.id}` },
          { text: "❌ Удалить", callback_data: `review_reject_${review.id}` },
        ]],
      });
    }

    res.json({ message: "Отзыв получен и отправлен на модерацию. Спасибо!" });
  } catch {
    res.status(500).json({ error: "Failed to submit review" });
  }
});

router.post("/:id/approve", async (req, res) => {
  if (!isAdminSession(req)) return res.status(401).json({ error: "Admin required" });
  try {
    await db.update(reviewsTable).set({ approved: true }).where(eq(reviewsTable.id, Number(req.params.id)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to approve review" });
  }
});

router.delete("/:id", async (req, res) => {
  if (!isAdminSession(req)) return res.status(401).json({ error: "Admin required" });
  try {
    await db.delete(reviewsTable).where(eq(reviewsTable.id, Number(req.params.id)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete review" });
  }
});

export default router;
