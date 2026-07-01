import { type Request, type Response } from "express";
  import { db } from "@workspace/db";
  import { usersTable } from "@workspace/db/schema";
  import { eq } from "drizzle-orm";

  const USER_COOKIE = "bruce3d_user";
  const ADMIN_COOKIE = "bruce3d_admin";

  // Detect Railway/production for correct cross-domain cookie settings (SameSite=none)
  const isProduction =
    process.env.NODE_ENV === "production" ||
    !!process.env.RAILWAY_ENVIRONMENT ||
    !!process.env.RAILWAY_PROJECT_ID ||
    !!process.env.RAILWAY_SERVICE_ID ||
    !!process.env.FRONTEND_URL;

  const cookieOpts = {
    httpOnly: true,
    sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
    secure: isProduction,
    signed: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };

  export async function getSessionUser(req: Request) {
    const userId = req.signedCookies?.[USER_COOKIE];
    if (!userId) return null;
    try {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, Number(userId))).limit(1);
      return user ?? null;
    } catch {
      return null;
    }
  }

  export function setSessionUser(res: Response, userId: number) {
    res.cookie(USER_COOKIE, String(userId), cookieOpts);
  }

  export function clearSessionUser(res: Response) {
    res.clearCookie(USER_COOKIE);
  }

  export function setAdminSession(res: Response) {
    res.cookie(ADMIN_COOKIE, "1", { ...cookieOpts, maxAge: 12 * 60 * 60 * 1000 });
  }

  export function isAdminSession(req: Request) {
    return req.signedCookies?.[ADMIN_COOKIE] === "1";
  }

  export function clearAdminSession(res: Response) {
    res.clearCookie(ADMIN_COOKIE);
  }
  