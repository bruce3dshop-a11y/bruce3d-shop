import { Router, type IRouter } from "express";
import path from "path";
import fs from "fs";
import healthRouter from "./health";
import authRouter from "./auth";
import ordersRouter from "./orders";
import adminRouter from "./admin";
import reviewsRouter from "./reviews";
import galleryRouter from "./gallery";
import statsRouter from "./stats";
import chatRouter from "./chat";
import webhookRouter from "./webhook";
import productsRouter from "./products";
import supportRouter from "./support";
import { isAdminSession } from "../lib/session";

const router: IRouter = Router();

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// Archive download
router.get("/download/bruce3d-shop-COMPLETE.tar", (req, res) => {
  const filePath = path.resolve(process.cwd(), "../../bruce3d-shop-COMPLETE.tar");
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Archive not found" });
  res.setHeader("Content-Disposition", 'attachment; filename="bruce3d-shop-COMPLETE.tar"');
  res.setHeader("Content-Type", "application/x-tar");
  res.sendFile(filePath);
});

// Serve uploaded order files — admin only
router.get("/uploads/:filename", (req, res) => {
  if (!isAdminSession(req)) return res.status(401).json({ error: "Unauthorized" });
  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "File not found" });
  res.sendFile(filePath);
});

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/orders", ordersRouter);
router.use("/order", ordersRouter);
router.use("/admin", adminRouter);
router.use("/reviews", reviewsRouter);
router.use("/gallery", galleryRouter);
router.use("/stats", statsRouter);
router.use("/chat", chatRouter);
router.use("/webhook", webhookRouter);
router.use("/products", productsRouter);
router.use("/support", supportRouter);

export default router;
