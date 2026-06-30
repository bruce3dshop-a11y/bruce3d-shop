const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

interface CloudinarySignature {
  signature: string;
  apiKey: string;
  cloudName: string;
  timestamp: string;
  folder: string;
}

export async function getUploadSignature(folder: string): Promise<CloudinarySignature | null> {
  try {
    const res = await fetch(`${BASE}/api/upload/sign?folder=${encodeURIComponent(folder)}`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function uploadFileToCloudinary(
  file: File,
  sig: CloudinarySignature
): Promise<{ url: string; originalName: string }> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", sig.folder);
  form.append("timestamp", sig.timestamp);
  form.append("api_key", sig.apiKey);
  form.append("signature", sig.signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`,
    { method: "POST", body: form }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any;
    throw new Error(err.error?.message || "Ошибка загрузки файла");
  }

  const data = await res.json() as any;
  return { url: data.secure_url as string, originalName: file.name };
}

export async function uploadFilesToCloudinary(
  files: File[],
  folder: string
): Promise<{ url: string; originalName: string }[]> {
  const sig = await getUploadSignature(folder);
  if (!sig) return [];

  const results: { url: string; originalName: string }[] = [];
  for (const file of files) {
    const result = await uploadFileToCloudinary(file, sig);
    results.push(result);
  }
  return results;
}
