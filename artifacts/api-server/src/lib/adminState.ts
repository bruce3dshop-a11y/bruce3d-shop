import { getAdminChatId, setAdminChatIdInConfig } from "./configStore";

// adminChatId is now backed by the file-based configStore
export let adminChatId: string | null = getAdminChatId() || null;

export function setAdminChatId(id: string) {
  adminChatId = id;
  setAdminChatIdInConfig(id);
}
