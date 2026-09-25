-- Renamed rather than drop+add so any existing review rows keep their data;
-- the "difficulty" metric is being replaced in meaning by "fun" (see rating
-- overhaul), not just relabeled, but a rename still avoids destroying rows.
ALTER TABLE "professor_reviews" RENAME COLUMN "difficultyRating" TO "funRating";
