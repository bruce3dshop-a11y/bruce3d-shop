import { Router } from "express";
  import path from "path";
  import fs from "fs";
  import { db } from "@workspace/db";
  import { productsTable } from "@workspace/db/schema";
  import { eq, asc } from "drizzle-orm";
  import { isAdminSession } from "../lib/session";
  import { uploadBuffer, isStorageConfigured } from "../lib/storage";
  import multer from "multer";

  const router = Router();

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  router.get("/", async (_req, res) => {
    try {
      const products = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.hidden, false))
        .orderBy(asc(productsTable.sort_order));
      res.json({ products });
    } catch {
      res.status(500).json({ error: "DB error" });
    }
  });

  router.post("/upload-image", (req, res) => {
    if (!isAdminSession(req)) return res.status(403).json({ error: "Forbidden" });

    upload.single("image")(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message });

      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) return res.status(400).json({ error: "Файл не получен" });

      try {
        let url: string;
        if (isStorageConfigured()) {
          url = await uploadBuffer(file.buffer, file.originalname, file.mimetype, "products");
        } else {
          const ext = path.extname(file.originalname) || ".jpg";
          const filename = `product-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
          const uploadDir = path.join(process.cwd(), "uploads");
          fs.mkdirSync(uploadDir, { recursive: true });
          fs.writeFileSync(path.join(uploadDir, filename), file.buffer);
          const proto = req.headers["x-forwarded-proto"] || req.protocol;
          const host = req.headers["x-forwarded-host"] || req.get("host");
          url = `${proto}://${host}/uploads/${filename}`;
        }
        res.json({ url });
      } catch (e: any) {
        console.error("[upload-image]", e);
        res.status(500).json({ error: e.message || "Ошибка загрузки файла" });
      }
    });
  });

  router.post("/", async (req, res) => {
    if (!isAdminSession(req)) return res.status(403).json({ error: "Forbidden" });
    try {
      const body = req.body;
      const [product] = await db
        .insert(productsTable)
        .values({
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
        })
        .returning();
      res.json({ product });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.patch("/:id", async (req, res) => {
    if (!isAdminSession(req)) return res.status(403).json({ error: "Forbidden" });
    try {
      const [product] = await db
        .update(productsTable)
        .set(req.body)
        .where(eq(productsTable.id, Number(req.params.id)))
        .returning();
      res.json({ product });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.delete("/:id", async (req, res) => {
    if (!isAdminSession(req)) return res.status(403).json({ error: "Forbidden" });
    try {
      await db.delete(productsTable).where(eq(productsTable.id, Number(req.params.id)));
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  export default router;
  