import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { supportSessionsTable, supportMessagesTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSessionUser, isAdminSession } from "../lib/session";
import { sendTelegram } from "../lib/telegram";
import { getAdminChatId } from "../lib/configStore";
import { randomUUID } from "crypto";

const router = Router();

// SSE clients map: sessionId -> Response[]
const clients = new Map<number, Response[]>();

// ── SSE stream (client connects here to receive messages in real-time) ──
router.get("/:sessionKey/stream", async (req: Request, res: Response) => {
  const { sessionKey } = req.params;

  const [session] = await db.select().from(supportSessionsTable)
    .where(eq(supportSessionsTable.session_key, sessionKey)).limit(1);

  if (!session) return res.status(404).end();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const arr = clients.get(session.id) || [];
  arr.push(res);
  clients.set(session.id, arr);

  const ping = setInterval(() => res.write(": ping\n\n"), 25000);
  req.on("close", () => {
    clearInterval(ping);
    const arr2 = clients.get(session.id) || [];
    clients.set(session.id, arr2.filter(c => c !== res));
  });
});

// ── Start or get existing session ──
router.post("/start", async (req: Request, res: Response) => {
  try {
    const user = await getSessionUser(req);
    const { visitorName, sessionKey: existingKey } = req.body;

    // Try to restore existing session
    if (existingKey) {
      const [existing] = await db.select().from(supportSessionsTable)
        .where(eq(supportSessionsTable.session_key, existingKey)).limit(1);
      if (existing) {
        const messages = await db.select().from(supportMessagesTable)
          .where(eq(supportMessagesTable.session_id, existing.id))
          .orderBy(supportMessagesTable.created_at);
        return res.json({ session: existing, messages });
      }
    }

    const sessionKey = randomUUID();
    const name = visitorName?.trim() || (user ? user.name : "Гость");

    const [session] = await db.insert(supportSessionsTable).values({
      session_key: sessionKey,
      user_id: user?.id ?? null,
      visitor_name: name,
      status: "open",
      last_message_at: new Date(),
    }).returning();

    res.json({ session, messages: [] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to start session" });
  }
});

// ── Send message (client or admin) ──
router.post("/:sessionKey/send", async (req: Request, res: Response) => {
  try {
    const user = await getSessionUser(req);
    const isAdmin = isAdminSession(req);
    const { message } = req.body;

    if (!message?.trim()) return res.status(400).json({ error: "Message required" });

    const [session] = await db.select().from(supportSessionsTable)
      .where(eq(supportSessionsTable.session_key, req.params.sessionKey)).limit(1);

    if (!session) return res.status(404).json({ error: "Session not found" });

    // Prevent clients from sending to a closed session (admins can still reply)
    const isAdminRequest = isAdminSession(req);
    if (session.status === "closed" && !isAdminRequest) {
      return res.status(403).json({ error: "Session is closed" });
    }

    const sender = isAdminRequest ? "admin" : "client";

    const [msg] = await db.insert(supportMessagesTable).values({
      session_id: session.id,
      sender,
      message: message.trim(),
    }).returning();

    // Update last_message_at
    await db.update(supportSessionsTable)
      .set({ last_message_at: new Date() })
      .where(eq(supportSessionsTable.id, session.id));

    // Broadcast to SSE listeners
    const payload = JSON.stringify({ type: "message", message: msg });
    const arr = clients.get(session.id) || [];
    arr.forEach(c => c.write(`data: ${payload}\n\n`));

    // Notify admin via Telegram when client sends first message
    if (sender === "client") {
      const adminId = getAdminChatId();
      if (adminId) {
        const msgCount = await db.select({ id: supportMessagesTable.id }).from(supportMessagesTable)
          .where(eq(supportMessagesTable.session_id, session.id)).limit(2);
        if (msgCount.length === 1) {
          // First message — notify admin
          await sendTelegram(adminId,
            `💬 <b>Новый чат поддержки</b>\n\n👤 ${session.visitor_name}\n\n📝 ${message.trim().slice(0, 300)}\n\nОтветьте в панели администратора.`
          ).catch(console.error);
        } else {
          await sendTelegram(adminId,
            `💬 <b>${session.visitor_name}</b>: ${message.trim().slice(0, 200)}`
          ).catch(console.error);
        }
      }
    }

    res.json({ ok: true, message: msg });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// ── Admin: list all sessions ──
router.get("/sessions", async (req: Request, res: Response) => {
  if (!isAdminSession(req)) return res.status(401).json({ error: "Admin required" });
  try {
    const sessions = await db.select().from(supportSessionsTable)
      .orderBy(desc(supportSessionsTable.last_message_at));
    res.json({ sessions });
  } catch {
    res.status(500).json({ error: "DB error" });
  }
});

// ── Admin: get messages for a session by ID ──
router.get("/sessions/:id/messages", async (req: Request, res: Response) => {
  if (!isAdminSession(req)) return res.status(401).json({ error: "Admin required" });
  try {
    const messages = await db.select().from(supportMessagesTable)
      .where(eq(supportMessagesTable.session_id, Number(req.params.id)))
      .orderBy(supportMessagesTable.created_at);

    const [session] = await db.select().from(supportSessionsTable)
      .where(eq(supportSessionsTable.id, Number(req.params.id))).limit(1);

    res.json({ messages, session });
  } catch {
    res.status(500).json({ error: "DB error" });
  }
});

// ── Admin: send from admin side via session ID ──
router.post("/sessions/:id/send", async (req: Request, res: Response) => {
  if (!isAdminSession(req)) return res.status(401).json({ error: "Admin required" });
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: "Message required" });

    const sessionId = Number(req.params.id);
    const [session] = await db.select().from(supportSessionsTable)
      .where(eq(supportSessionsTable.id, sessionId)).limit(1);

    if (!session) return res.status(404).json({ error: "Session not found" });

    const [msg] = await db.insert(supportMessagesTable).values({
      session_id: sessionId,
      sender: "admin",
      message: message.trim(),
    }).returning();

    await db.update(supportSessionsTable)
      .set({ last_message_at: new Date() })
      .where(eq(supportSessionsTable.id, sessionId));

    const payload = JSON.stringify({ type: "message", message: msg });
    const arr = clients.get(sessionId) || [];
    arr.forEach(c => c.write(`data: ${payload}\n\n`));

    res.json({ ok: true, message: msg });
  } catch {
    res.status(500).json({ error: "Failed to send" });
  }
});

// ── Admin: close session ──
router.post("/sessions/:id/close", async (req: Request, res: Response) => {
  if (!isAdminSession(req)) return res.status(401).json({ error: "Admin required" });
  try {
    await db.update(supportSessionsTable)
      .set({ status: "closed" })
      .where(eq(supportSessionsTable.id, Number(req.params.id)));

    // Notify SSE listeners
    const payload = JSON.stringify({ type: "closed" });
    const arr = clients.get(Number(req.params.id)) || [];
    arr.forEach(c => c.write(`data: ${payload}\n\n`));

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "DB error" });
  }
});

// ── Admin: delete single session ──
router.delete("/sessions/:id", async (req: Request, res: Response) => {
  if (!isAdminSession(req)) return res.status(401).json({ error: "Admin required" });
  try {
    const id = Number(req.params.id);
    await db.delete(supportMessagesTable).where(eq(supportMessagesTable.session_id, id));
    await db.delete(supportSessionsTable).where(eq(supportSessionsTable.id, id));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "DB error" });
  }
});

// ── Admin: bulk-delete sessions ──
router.post("/sessions/bulk-delete", async (req: Request, res: Response) => {
  if (!isAdminSession(req)) return res.status(401).json({ error: "Admin required" });
  try {
    const { ids } = req.body as { ids: number[] };
    if (!ids || !Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "ids required" });
    for (const id of ids) {
      await db.delete(supportMessagesTable).where(eq(supportMessagesTable.session_id, id));
      await db.delete(supportSessionsTable).where(eq(supportSessionsTable.id, id));
    }
    res.json({ ok: true, deleted: ids.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
