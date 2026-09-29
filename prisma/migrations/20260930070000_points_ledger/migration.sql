-- Points ledger (replaces the ScoreEvent-based community score). Additive: score_events is kept but no longer written.
CREATE TABLE "point_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "refId" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "point_events_userId_key_refId_key" ON "point_events"("userId", "key", "refId");
CREATE INDEX "point_events_userId_createdAt_idx" ON "point_events"("userId", "createdAt");
CREATE INDEX "point_events_key_idx" ON "point_events"("key");

ALTER TABLE "point_events" ADD CONSTRAINT "point_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Everyone starts fresh at 0 under the new ledger (the cached total must equal SUM(point_events.points)).
UPDATE "users" SET "communityScore" = 0;
