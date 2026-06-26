import crypto from "crypto";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export function isStorageConfigured(): boolean {
  return !!(CLOUD_NAME && API_KEY && API_SECRET);
}

function sign(params: Record<string, string>, secret: string): string {
  const str = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join("&");
  return crypto.createHash("sha256").update(str + secret).digest("hex");
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

  const base64File = `data:${mimeType};base64,${buffer.toString("base64")}`;

  const body = new URLSearchParams({
    file: base64File,
    folder,
    timestamp,
    api_key: API_KEY!,
    signature,
  });

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    }
  );

  const data = await res.json() as any;
  if (!res.ok) throw new Error(data.error?.message || "Ошибка загрузки в Cloudinary");

  return data.secure_url as string;
}
