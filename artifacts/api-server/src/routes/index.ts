import { Router, type IRouter } from "express";
import bookReviewsRouter from "./book-reviews";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);
router.use(bookReviewsRouter);

export default router;
