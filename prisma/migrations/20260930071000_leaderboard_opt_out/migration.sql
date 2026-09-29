-- Leaderboard visibility: everyone is shown by default; users can opt out from their Profile.
ALTER TABLE "users" ADD COLUMN "showOnLeaderboard" BOOLEAN NOT NULL DEFAULT true;
