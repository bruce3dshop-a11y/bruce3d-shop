import crypto from "crypto";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export function isStorageConfigured(): boolean {
  return !!(CLOUD_NAME && API_KEY && API_SECRET);
}

function sign(params: Record<string, string>, secret: string): string {
  const str = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join("&");
  return crypto.createHash("sha1").update(str + secret).digest("hex");
}

export function createUploadSignature(folder: string, timestamp: string) {
  if (!isStorageConfigured()) return null;
  const params: Record<string, string> = { folder, timestamp };
  const signature = sign(params, API_SECRET!);
  return { signature, apiKey: API_KEY!, cloudName: CLOUD_NAME!, timestamp, folder };
}

export async function uploadBuffer(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder = "uploads"
): Promise<string> {
  if (!isStorageConfigured()) {
    throw new Error("Cloudinary не настроен. Задайте CLOUDINARY_* переменные в Railway.");
  }

  const timestamp = String(Math.floor(Date.now() / 1000));
  const params: Record<string, string> = { folder, timestamp };
  const signature = sign(params, API_SECRET!);

  const form = new FormData();
  form.append("file", new Blob([buffer], { type: mimeType }), originalName);
  form.append("folder", folder);
  form.append("timestamp", timestamp);
  form.append("api_key", API_KEY!);
  form.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    { method: "POST", body: form }
  );

  const data = await res.json() as any;
  if (!res.ok) throw new Error(data.error?.message || "Ошибка загрузки в Cloudinary");

  return data.secure_url as string;
}
