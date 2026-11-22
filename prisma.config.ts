import "dotenv/config";
import { defineConfig } from "prisma/config";

// This file is only read by the Prisma CLI (`generate`, `migrate deploy`); the app
// itself connects with DATABASE_URL in src/lib/prisma.ts.
//
// `prisma generate` doesn't need a live database, so we read env vars directly
// instead of via the `env()` helper — that helper throws at config-load time if
// the var is unset, which would break `generate` (and therefore `npm install`).
//
// Migrations take a Postgres session advisory lock. Behind a pooled connection
// (Neon's `-pooler` host / PgBouncer) that lock can leak onto a shared backend
// connection, so the next build's `migrate deploy` waits on it and fails with
// P1002. So for the CLI we always prefer a direct (non-pooled) connection:
//   1. DIRECT_URL                — set by hand
//   2. DATABASE_URL_UNPOOLED     — set automatically by Vercel's Neon integration
//   3. POSTGRES_URL_NON_POOLING  — older Vercel Postgres / Neon integration name
//   4. DATABASE_URL              — with Neon's `-pooler` host rewritten to the direct host
function directDatabaseUrl(): string | undefined {
  const explicit =
    process.env.DIRECT_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING;
  if (explicit) return explicit;

  const pooled = process.env.DATABASE_URL;
  if (!pooled) return undefined;
  try {
    const url = new URL(pooled);
    // Neon: ep-foo-123-pooler.us-east-2.aws.neon.tech -> ep-foo-123.us-east-2.aws.neon.tech
    if (url.hostname.endsWith(".neon.tech") && url.hostname.includes("-pooler.")) {
      url.hostname = url.hostname.replace("-pooler.", ".");
      url.searchParams.delete("pgbouncer");
      return url.toString();
    }
  } catch {
    // Not a parseable URL; hand it to Prisma as-is and let it report the error.
  }
  return pooled;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: directDatabaseUrl(),
  },
});
