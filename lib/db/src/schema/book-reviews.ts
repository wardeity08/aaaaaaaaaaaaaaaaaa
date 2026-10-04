import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bookReviewsTable = pgTable(
  "book_reviews",
  {
    id: serial("id").primaryKey(),
    bookId: varchar("book_id", { length: 200 }).notNull(),
    reviewerName: varchar("reviewer_name", { length: 80 })
      .notNull()
      .default("Reader"),
    rating: integer("rating").notNull(),
    comment: text("comment").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "book_reviews_rating_range",
      sql`${table.rating} >= 1 AND ${table.rating} <= 5`,
    ),
    index("book_reviews_book_created_idx").on(
      table.bookId,
      table.createdAt,
    ),
  ],
);

export const insertBookReviewSchema = createInsertSchema(bookReviewsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertBookReview = z.infer<typeof insertBookReviewSchema>;
export type BookReview = typeof bookReviewsTable.$inferSelect;