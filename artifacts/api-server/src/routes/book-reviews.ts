import { Router, type IRouter } from "express";
import { avg, desc, eq, count } from "drizzle-orm";
import { db, bookReviewsTable } from "@workspace/db";
import {
  CreateBookReviewBody,
  CreateBookReviewParams,
  CreateBookReviewResponse,
  ListBookReviewsParams,
  ListBookReviewsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get(
  "/books/:bookId/reviews",
  async (req, res): Promise<void> => {
    const params = ListBookReviewsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const { bookId } = params.data;
    const reviews = await db
      .select()
      .from(bookReviewsTable)
      .where(eq(bookReviewsTable.bookId, bookId))
      .orderBy(desc(bookReviewsTable.createdAt));
    const [summary] = await db
      .select({
        reviewCount: count(),
        averageRating: avg(bookReviewsTable.rating),
      })
      .from(bookReviewsTable)
      .where(eq(bookReviewsTable.bookId, bookId));

    res.json(
      ListBookReviewsResponse.parse({
        bookId,
        averageRating: Number(summary?.averageRating ?? 0),
        reviewCount: summary?.reviewCount ?? 0,
        reviews,
      }),
    );
  },
);

router.post(
  "/books/:bookId/reviews",
  async (req, res): Promise<void> => {
    const params = CreateBookReviewParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = CreateBookReviewBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const comment = parsed.data.comment.trim();
    if (!comment) {
      res.status(400).json({ error: "Add a comment before submitting." });
      return;
    }

    const reviewerName =
      parsed.data.reviewerName?.trim().slice(0, 80) || "Reader";
    const [review] = await db
      .insert(bookReviewsTable)
      .values({
        bookId: params.data.bookId,
        reviewerName,
        rating: parsed.data.rating,
        comment,
      })
      .returning();

    res
      .status(201)
      .json(CreateBookReviewResponse.parse(review));
  },
);

export default router;