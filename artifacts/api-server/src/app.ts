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
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded order files (accessible to admin)
app.use("/uploads", express.static(UPLOAD_DIR));

// Temporary download endpoint for project archive
app.get("/download/bruce3d-shop-COMPLETE.tar", (req, res) => {
  const filePath = path.resolve(process.cwd(), "../../bruce3d-shop-COMPLETE.tar");
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Archive not found" });
  }
  res.setHeader("Content-Disposition", 'attachment; filename="bruce3d-shop-COMPLETE.tar"');
  res.setHeader("Content-Type", "application/x-tar");
  res.sendFile(filePath);
});

app.use("/api", router);

export default app;
