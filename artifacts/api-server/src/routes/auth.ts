import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser, setSessionUser, clearSessionUser, setAdminSession, isAdminSession } from "../lib/session";
import bcrypt from "bcryptjs";

const router = Router();

router.get("/me", async (req, res) => {
  try {
    const user = await getSessionUser(req);
    if (!user) return res.json({ user: null });
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
  } catch (e) {
    res.status(500).json({ error: "Ошибка входа" });
  }
});

router.post("/admin-login", async (req, res) => {
  try {
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    if (!ADMIN_PASSWORD) {
      return res.status(503).json({ error: "Переменная ADMIN_PASSWORD не задана на сервере. Установите её в Railway." });
    }
    const { password } = req.body;
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Неверный пароль" });
    setAdminSession(res);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Ошибка входа" });
  }
});

router.post("/logout", (_req, res) => {
  clearSessionUser(res);
  res.json({ ok: true });
});

export default router;
