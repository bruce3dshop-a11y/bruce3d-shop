import { Router } from "express";
import { isStorageConfigured, createUploadSignature } from "../lib/storage";

const router = Router();

router.get("/sign", (req, res) => {
  if (!isStorageConfigured()) {
    return res.status(400).json({ error: "Хранилище файлов не настроено. Добавьте CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET в Railway." });
  }
  const folder = (req.query.folder as string) || "uploads";
  const timestamp = String(Math.floor(Date.now() / 1000));
  const sig = createUploadSignature(folder, timestamp);
  res.json(sig);
});

export default router;
