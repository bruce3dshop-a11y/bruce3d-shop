import { Router, Request, Response } from "express";
import { IncomingMessage } from "http";
import busboy from "busboy";
import { isStorageConfigured, createUploadSignature, uploadBuffer } from "../lib/storage";

const router = Router();

interface UploadedFile {
  fieldname: string;
  originalname: string;
  buffer: Buffer;
  mimetype: string;
}

/** Parse a single file from a multipart/form-data request via busboy (Express 5 compatible) */
function parseUpload(req: IncomingMessage): Promise<{ fields: Record<string, string>; file: UploadedFile | null }> {
  return new Promise((resolve, reject) => {
    const fields: Record<string, string> = {};
    let file: UploadedFile | null = null;

    const bb = busboy({
      headers: req.headers as Record<string, string>,
      limits: { fileSize: 20 * 1024 * 1024, files: 1 },
    });

    bb.on("field", (name, value) => {
      fields[name] = value;
    });

    bb.on("file", (fieldname, stream, info) => {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", () => {
        file = {
          fieldname,
          originalname: info.filename ?? "upload",
          buffer: Buffer.concat(chunks),
          mimetype: info.mimeType ?? "application/octet-stream",
        };
      });
      stream.on("error", reject);
    });

    bb.on("finish", () => resolve({ fields, file }));
    bb.on("error", reject);

    req.pipe(bb);
  });
}

/** POST /api/upload — direct file upload (avatar, etc.) */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { fields, file } = await parseUpload(req);
    if (!file) return res.status(400).json({ error: "Файл не получен" });

    const type = fields.type || "upload";

    if (isStorageConfigured()) {
      const folder = type === "avatar" ? "avatars" : "uploads";
      const url = await uploadBuffer(file.buffer, file.originalname, file.mimetype, folder);
      return res.json({ url });
    }

    // Fallback — return data URL so the client can preview without storage configured
    const base64 = file.buffer.toString("base64");
    return res.json({ url: `data:${file.mimetype};base64,${base64}` });
  } catch (e: any) {
    console.error("[upload POST]", e);
    res.status(500).json({ error: e?.message || "Ошибка загрузки файла" });
  }
});

/** GET /api/upload/sign — Cloudinary client-side upload signature */
router.get("/sign", (req: Request, res: Response) => {
  if (!isStorageConfigured()) {
    return res.status(400).json({
      error: "Хранилище файлов не настроено. Добавьте CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET в Railway.",
    });
  }
  const folder = (req.query.folder as string) || "uploads";
  const timestamp = String(Math.floor(Date.now() / 1000));
  const sig = createUploadSignature(folder, timestamp);
  res.json(sig);
});

export default router;
