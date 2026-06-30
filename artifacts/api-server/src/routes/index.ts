import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import ordersRouter from "./orders";
import adminRouter from "./admin";
import webhookRouter from "./webhook";
import chatRouter from "./chat";
import galleryRouter from "./gallery";
import productsRouter from "./products";
import reviewsRouter from "./reviews";
import statsRouter from "./stats";
import supportRouter from "./support";
import yookassaRouter from "./yookassa";
import uploadRouter from "./upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/orders", ordersRouter);
router.use("/order", ordersRouter);
router.use("/upload", uploadRouter);
router.use("/admin", adminRouter);
router.use("/webhook", webhookRouter);
router.use("/chat", chatRouter);
router.use("/gallery", galleryRouter);
router.use("/products", productsRouter);
router.use("/reviews", reviewsRouter);
router.use("/stats", statsRouter);
router.use("/support", supportRouter);
router.use("/yookassa", yookassaRouter);

export default router;
