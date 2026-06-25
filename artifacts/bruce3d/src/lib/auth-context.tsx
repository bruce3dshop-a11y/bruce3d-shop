import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { apiFetch } from "./api";

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  telegram?: string;
  is_admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  register: (data: { name: string; email: string; phone?: string; telegram?: string; password: string }) => Promise<void>;
  login: (data: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, isAdmin: false, isLoading: true,
  register: async () => {}, login: async () => {}, logout: async () => {}, refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch<{ user: User | null }>("auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const register = async (data: { name: string; email: string; phone?: string; telegram?: string; password: string }) => {
    const result = await apiFetch<{ user: User }>("auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setUser(result.user);
  };

  const login = async (data: { email: string; password: string }) => {
    const result = await apiFetch<{ user: User }>("auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setUser(result.user);
  };

  const logout = async () => {
    await apiFetch("auth/logout", { method: "POST" });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin: !!user?.is_admin, isLoading, register, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
