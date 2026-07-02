import { Router } from "express";
  import { db } from "@workspace/db";
  import { usersTable } from "@workspace/db/schema";
  import { eq } from "drizzle-orm";
  import { getSessionUser, setSessionUser, clearSessionUser, setAdminSession, isAdminSession } from "../lib/session";
  import { createHmac, timingSafeEqual } from "crypto";
  import bcrypt from "bcryptjs";

  const router = Router();

  export function makeAdminToken(password: string): string {
    const exp = Date.now() + 12 * 60 * 60 * 1000;
    const payload = Buffer.from(JSON.stringify({ exp })).toString("base64url");
    const sig = createHmac("sha256", password).update(payload).digest("base64url");
    return `${payload}.${sig}`;
  }

  export function verifyAdminToken(token: string, password: string): boolean {
    try {
      const dot = token.lastIndexOf(".");
      if (dot < 0) return false;
      const payloadB64 = token.slice(0, dot);
      const sig = token.slice(dot + 1);
      const expectedSig = createHmac("sha256", password).update(payloadB64).digest("base64url");
      const bufA = Buffer.from(sig);
      const bufB = Buffer.from(expectedSig);
      if (bufA.length !== bufB.length) return false;
      if (!timingSafeEqual(bufA, bufB)) return false;
      const { exp } = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
      return Date.now() < exp;
    } catch { return false; }
  }

  router.get("/me", async (req, res) => {
    try {
      const user = await getSessionUser(req);
      if (!user) {
        if (isAdminSession(req)) {
          return res.json({ user: { id: 0, name: "Администратор", email: "admin@bruce3d.local", is_admin: true } });
        }
        return res.json({ user: null });
      }
      const isAdmin = isAdminSession(req) || !!user.is_admin;
      res.json({ user: { ...user, is_admin: isAdmin } });
    } catch {
      res.json({ user: null });
    }
  });

  router.post("/register", async (req, res) => {
    try {
      const { name, email, phone, telegram, password } = req.body;
      if (!name || !email) return res.status(400).json({ error: "Имя и email обязательны" });
      if (!password) return res.status(400).json({ error: "Пароль обязателен" });
      if (password.length < 6) return res.status(400).json({ error: "Пароль минимум 6 символов" });

      const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
      if (existing) return res.status(409).json({ error: "Этот email уже зарегистрирован" });

      const password_hash = await bcrypt.hash(password, 10);
      const [user] = await db.insert(usersTable).values({ name, email, phone, telegram, password_hash }).returning();
      setSessionUser(res, user.id);
      const { password_hash: _, ...safeUser } = user;
      res.json({ user: safeUser });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Ошибка регистрации" });
    }
  });

  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Email и пароль обязательны" });
      const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
      if (!user) return res.status(401).json({ error: "Неверный email или пароль" });
      if (!user.password_hash) return res.status(401).json({ error: "Используйте форму регистрации" });
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: "Неверный email или пароль" });
      setSessionUser(res, user.id);
      const { password_hash: _, ...safeUser } = user;
      res.json({ user: safeUser });
    } catch {
      res.status(500).json({ error: "Ошибка входа" });
    }
  });

  router.post("/admin-login", async (req, res) => {
    try {
      const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
      const ADMIN_LOGIN_ENV = process.env.ADMIN_LOGIN;
      if (!ADMIN_PASSWORD) {
        return res.status(503).json({ error: "ADMIN_PASSWORD не задан на сервере. Установите его в Railway." });
      }
      const { login, password } = req.body;
      // Проверяем логин, если задана переменная ADMIN_LOGIN
      if (ADMIN_LOGIN_ENV) {
        const _la = createHmac("sha256", "bruce3d-login-check").update(String(login ?? "")).digest();
        const _lb = createHmac("sha256", "bruce3d-login-check").update(String(ADMIN_LOGIN_ENV)).digest();
        if (_la.length !== _lb.length || !timingSafeEqual(_la, _lb)) {
          return res.status(401).json({ error: "Неверный логин или пароль" });
        }
      }
      const _a = createHmac("sha256", "bruce3d-check").update(String(password)).digest();
      const _b = createHmac("sha256", "bruce3d-check").update(String(ADMIN_PASSWORD)).digest();
      if (!timingSafeEqual(_a, _b)) return res.status(401).json({ error: "Неверный логин или пароль" });

      // Set cookie (works same-domain; may not work cross-domain with SameSite=lax)
      setAdminSession(res);

      // Also return a signed token for X-Admin-Token header (works cross-domain always)
      const adminToken = makeAdminToken(ADMIN_PASSWORD);
      res.json({ ok: true, token: adminToken });
    } catch {
      res.status(500).json({ error: "Ошибка входа" });
    }
  });

  router.post("/logout", (_req, res) => {
    clearSessionUser(res);
    res.json({ ok: true });
  });

  export default router;
  