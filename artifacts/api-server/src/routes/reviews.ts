import { Router } from "express";
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

router.post("/", async (req, res) => {
  try {
    const { name, role, rating, text } = req.body;
    if (!name || !text) return res.status(400).json({ error: "name and text required" });

    const [review] = await db.insert(reviewsTable).values({
      name, role, rating: Number(rating) || 5, text, approved: false,
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
