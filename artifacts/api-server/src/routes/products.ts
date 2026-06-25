import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { isAdminSession } from "../lib/session";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `product_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get("/", async (_req, res) => {
  try {
    const products = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.hidden, false))
      .orderBy(asc(productsTable.sort_order));
    res.json({ products });
  } catch { res.status(500).json({ error: "DB error" }); }
});

router.post("/upload-image", async (req, res) => {
  if (!isAdminSession(req)) return res.status(403).json({ error: "Forbidden" });
  upload.single("image")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    const file = (req as any).file;
    if (!file) return res.status(400).json({ error: "No file" });
    const base = process.env.BASE_URL || "";
    const url = `${base}/api/uploads/${file.filename}`;
    res.json({ url, filename: file.filename });
  });
});

router.post("/", async (req, res) => {
  if (!isAdminSession(req)) return res.status(403).json({ error: "Forbidden" });
  try {
    const body = req.body;
    const [product] = await db.insert(productsTable).values({
      title: body.title,
      description: body.description || null,
      price: body.price ? String(body.price) : null,
      discount_price: body.discount_price || null,
      image_url: body.image_url || "",
      extra_images: body.extra_images || null,
      external_link: body.external_link || null,
      badge: body.badge || null,
      series: body.series || "series-01",
      in_stock: body.in_stock !== false,
      hidden: false,
      sort_order: Number(body.sort_order) || 0,
    }).returning();
    res.json({ product });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.patch("/:id", async (req, res) => {
  if (!isAdminSession(req)) return res.status(403).json({ error: "Forbidden" });
  try {
    const [product] = await db.update(productsTable)
      .set(req.body)
      .where(eq(productsTable.id, Number(req.params.id)))
      .returning();
    res.json({ product });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/:id", async (req, res) => {
  if (!isAdminSession(req)) return res.status(403).json({ error: "Forbidden" });
  try {
    await db.delete(productsTable).where(eq(productsTable.id, Number(req.params.id)));
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
