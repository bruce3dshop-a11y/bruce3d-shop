const BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + "/" : (import.meta.env.BASE_URL ?? "/");

export function apiUrl(path: string) {
  return `${BASE}api/${path.replace(/^\//, "")}`;
}

export async function apiFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}
