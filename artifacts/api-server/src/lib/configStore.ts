import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "data", "bot-config.json");

interface BotConfig {
  botToken: string;
  adminChatId: string;
  webhookDomain: string;
  groupChatId: string;
}

const DEFAULT_CONFIG: BotConfig = {
  botToken: "",
  adminChatId: "",
  webhookDomain: "",
  groupChatId: "",
};

function loadConfig(): BotConfig {
  try {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    if (!fs.existsSync(CONFIG_PATH)) {
      saveConfig(DEFAULT_CONFIG);
      return { ...DEFAULT_CONFIG };
    }
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    console.error("[configStore] Failed to load config:", e);
    return { ...DEFAULT_CONFIG };
  }
}

function saveConfig(config: BotConfig) {
  try {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
  } catch (e) {
    console.error("[configStore] Failed to save config:", e);
  }
}

// Load once at startup, then keep in memory
let _config: BotConfig = loadConfig();

// If token is missing from file but present in env — seed it into the file
if (!_config.botToken && process.env.TELEGRAM_BOT_TOKEN) {
  _config.botToken = process.env.TELEGRAM_BOT_TOKEN;
  saveConfig(_config);
}
if (!_config.adminChatId && process.env.TELEGRAM_ADMIN_CHAT_ID) {
  _config.adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  saveConfig(_config);
}

export function getConfig(): BotConfig {
  return { ..._config };
}

export function getBotToken(): string {
  return _config.botToken || process.env.TELEGRAM_BOT_TOKEN || "";
}

export function getAdminChatId(): string {
  return _config.adminChatId || "";
}

export function getWebhookDomain(): string {
  return _config.webhookDomain || "";
}

export function getGroupChatId(): string {
  return _config.groupChatId || "";
}

export function updateConfig(partial: Partial<BotConfig>) {
  _config = { ..._config, ...partial };
  saveConfig(_config);
}

export function setAdminChatIdInConfig(chatId: string) {
  _config.adminChatId = chatId;
  saveConfig(_config);
}
