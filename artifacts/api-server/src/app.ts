import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
      res(res) { return { statusCode: res.statusCode }; },
    },
  }),
);
const rawFrontendUrl = process.env.FRONTEND_URL;
const allowedOrigin = rawFrontendUrl ? rawFrontendUrl.replace(/\/$/, "") : true;
app.use(cors({ origin: allowedOrigin, credentials: true }));

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  logger.warn("SESSION_SECRET is not set — cookies will not be signed. Set SESSION_SECRET in Railway.");
}
app.use(cookieParser(SESSION_SECRET || "default-unsigned"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(UPLOAD_DIR));

app.use("/api", router);

export default app;
