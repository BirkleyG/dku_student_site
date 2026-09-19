import "dotenv/config";
import { defineConfig } from "prisma/config";

// `prisma generate` doesn't need a live database, so we read DATABASE_URL
// directly instead of via the `env()` helper — that helper throws at
// config-load time if the var is unset, which would break `generate`
// (and therefore `npm install`) on a fresh deploy before the DB is wired up.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
