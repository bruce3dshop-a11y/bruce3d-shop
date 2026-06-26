import { pool } from "@workspace/db";

interface BotConfig {
  botToken: string;
  adminChatId: string;
  webhookDomain: string;
  groupChatId: string;
}

const KEY_MAP: Record<keyof BotConfig, string> = {
  botToken: "bot_token",
  adminChatId: "admin_chat_id",
  webhookDomain: "webhook_domain",
  groupChatId: "group_chat_id",
};

let _config: BotConfig = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || "",
  adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID || "",
  webhookDomain: process.env.WEBHOOK_DOMAIN || "",
  groupChatId: process.env.TELEGRAM_GROUP_CHAT_ID || "",
};

async function init() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bot_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
    const { rows } = await pool.query("SELECT key, value FROM bot_config");
    for (const row of rows) {
      const configKey = (Object.entries(KEY_MAP) as [keyof BotConfig, string][])
        .find(([, dbKey]) => dbKey === row.key)?.[0];
      if (configKey && row.value) {
        _config[configKey] = row.value;
      }
    }
    console.log("[configStore] Loaded from DB");
  } catch (e) {
    console.error("[configStore] DB init failed, using env vars:", e);
  }
}

init().catch(console.error);

async function persistKey(key: keyof BotConfig, value: string) {
  try {
    const dbKey = KEY_MAP[key];
    await pool.query(
      "INSERT INTO bot_config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
      [dbKey, value]
    );
  } catch (e) {
    console.error("[configStore] Failed to persist:", e);
  }
}

export function getConfig(): BotConfig {
  return { ..._config };
}

export function getBotToken(): string {
  return _config.botToken || process.env.TELEGRAM_BOT_TOKEN || "";
}

export function getAdminChatId(): string {
  return _config.adminChatId || process.env.TELEGRAM_ADMIN_CHAT_ID || "";
}

export function getWebhookDomain(): string {
  return _config.webhookDomain || process.env.WEBHOOK_DOMAIN || "";
}

export function getGroupChatId(): string {
  return _config.groupChatId || process.env.TELEGRAM_GROUP_CHAT_ID || "";
}

export function updateConfig(partial: Partial<BotConfig>) {
  _config = { ..._config, ...partial };
  for (const [k, v] of Object.entries(partial) as [keyof BotConfig, string][]) {
    if (v !== undefined) persistKey(k, v).catch(console.error);
  }
}

export function setAdminChatIdInConfig(chatId: string) {
  _config.adminChatId = chatId;
  persistKey("adminChatId", chatId).catch(console.error);
}
