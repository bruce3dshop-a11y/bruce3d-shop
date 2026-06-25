import fs from "fs";
import { getBotToken } from "./configStore";

function token(): string {
  return getBotToken();
}

function api(): string {
  return `https://api.telegram.org/bot${token()}`;
}

export async function sendTelegram(chatId: string | number, text: string) {
  const tok = token();
  if (!tok) return;
  try {
    await fetch(`${api()}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
  } catch (e) {
    console.error("Telegram send error:", e);
  }
}

export async function sendTelegramWithKeyboard(
  chatId: string | number,
  text: string,
  reply_markup: object
) {
  if (!token()) return;
  try {
    const r = await fetch(`${api()}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", reply_markup }),
    });
    return r.json();
  } catch (e) {
    console.error("Telegram keyboard send error:", e);
  }
}

export async function editTelegramMessage(
  chatId: string | number,
  messageId: number,
  text: string,
  reply_markup?: object
) {
  if (!token()) return;
  try {
    await fetch(`${api()}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: "HTML", reply_markup }),
    });
  } catch (e) {
    console.error("Telegram edit error:", e);
  }
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  if (!token()) return;
  try {
    await fetch(`${api()}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
    });
  } catch {}
}

export async function sendTelegramDocument(
  chatId: string | number,
  filePath: string,
  caption?: string
): Promise<boolean> {
  if (!token()) return false;
  try {
    const formData = new FormData();
    formData.append("chat_id", String(chatId));
    if (caption) formData.append("caption", caption);
    formData.append("parse_mode", "HTML");

    const fileBuffer = fs.readFileSync(filePath);
    const fileName = filePath.split("/").pop() || "file";
    const blob = new Blob([fileBuffer]);
    formData.append("document", blob, fileName);

    const r = await fetch(`${api()}/sendDocument`, {
      method: "POST",
      body: formData,
    });
    const data = await r.json() as { ok: boolean };
    return data.ok;
  } catch (e) {
    console.error("Telegram sendDocument error:", e);
    return false;
  }
}

export async function sendTelegramPhoto(
  chatId: string | number,
  filePath: string,
  caption?: string
): Promise<boolean> {
  if (!token()) return false;
  try {
    const formData = new FormData();
    formData.append("chat_id", String(chatId));
    if (caption) formData.append("caption", caption);
    formData.append("parse_mode", "HTML");

    const fileBuffer = fs.readFileSync(filePath);
    const fileName = filePath.split("/").pop() || "photo.jpg";
    const blob = new Blob([fileBuffer]);
    formData.append("photo", blob, fileName);

    const r = await fetch(`${api()}/sendPhoto`, {
      method: "POST",
      body: formData,
    });
    const data = await r.json() as { ok: boolean };
    return data.ok;
  } catch (e) {
    console.error("Telegram sendPhoto error:", e);
    return false;
  }
}

export async function getTelegramFileUrl(fileId: string): Promise<string | null> {
  if (!token()) return null;
  try {
    const r = await fetch(`${api()}/getFile?file_id=${fileId}`);
    const data = await r.json() as { ok: boolean; result?: { file_path: string } };
    if (data.ok && data.result) {
      return `https://api.telegram.org/file/bot${token()}/${data.result.file_path}`;
    }
  } catch {}
  return null;
}

export async function registerWebhook(domain: string) {
  if (!token()) return { ok: false, error: "No bot token" };
  // Strip any protocol prefix the user may have accidentally included
  const cleanDomain = domain.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  const url = `https://${cleanDomain}/api/webhook/telegram`;
  const r = await fetch(`${api()}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, allowed_updates: ["message", "callback_query"] }),
  });
  return r.json();
}

export async function getBotInfo() {
  if (!token()) return null;
  try {
    const r = await fetch(`${api()}/getMe`);
    const data = await r.json() as { ok: boolean; result?: { username: string; first_name: string } };
    return data.ok ? data.result : null;
  } catch {
    return null;
  }
}
