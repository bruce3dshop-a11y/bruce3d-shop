const API_BASE = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : "";

  export function apiUrl(path: string) {
    return `${API_BASE}/api/${path.replace(/^\//, "")}`;
  }

  const ADMIN_TOKEN_KEY = "bruce3d_admin_token";

  export function saveAdminToken(t: string) {
    try { localStorage.setItem(ADMIN_TOKEN_KEY, t); } catch {}
  }
  export function clearAdminToken() {
    try { localStorage.removeItem(ADMIN_TOKEN_KEY); } catch {}
  }
  function getAdminToken(): string | null {
    try { return localStorage.getItem(ADMIN_TOKEN_KEY); } catch { return null; }
  }

  export async function apiFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
    const adminToken = getAdminToken();
    const extraHeaders: Record<string, string> = {};
    if (adminToken) extraHeaders["X-Admin-Token"] = adminToken;

    // Не устанавливаем Content-Type для FormData — браузер сам ставит с правильным boundary
    const isFormData = options?.body instanceof FormData;
    const contentTypeHeader = isFormData ? {} : { "Content-Type": "application/json" };

    const res = await fetch(apiUrl(path), {
      credentials: "include",
      headers: { ...contentTypeHeader, ...extraHeaders, ...options?.headers },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
  }
  