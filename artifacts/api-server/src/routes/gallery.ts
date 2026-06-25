import { Router } from "express";
import { db } from "@workspace/db";
import { galleryItemsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { isAdminSession } from "../lib/session";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const items = await db.select().from(galleryItemsTable).orderBy(galleryItemsTable.created_at);
    res.json({ items: items.reverse() });
  } catch (e) {
    res.status(500).json({ error: "Failed to get gallery" });
  }
});

router.delete("/:id", async (req, res) => {
  if (!isAdminSession(req)) return res.status(401).json({ error: "Admin required" });
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    const deleted = await db.delete(galleryItemsTable).where(eq(galleryItemsTable.id, id)).returning();
    if (!deleted.length) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete" });
  }
});

export default router;
