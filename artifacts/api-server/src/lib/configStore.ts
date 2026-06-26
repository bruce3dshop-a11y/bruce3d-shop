interface BotConfig {
  botToken: string;
  adminChatId: string;
  webhookDomain: string;
  groupChatId: string;
}

let _config: BotConfig = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || "",
  adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID || "",
  webhookDomain: process.env.WEBHOOK_DOMAIN || "",
  groupChatId: process.env.TELEGRAM_GROUP_CHAT_ID || "",
};

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
}

export function setAdminChatIdInConfig(chatId: string) {
  _config.adminChatId = chatId;
}
