# DKU Life

One home for everything happening at Duke Kunshan University — events, food, news, and campus wisdom.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Prisma](https://www.prisma.io) + PostgreSQL (via `@prisma/adapter-pg`)
- [NextAuth](https://authjs.dev) (credentials, JWT sessions)
- [Framer Motion](https://www.framer.com/motion/) for scroll/transition effects

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FBirkleyG%2Fdku_student_site&env=DATABASE_URL,AUTH_SECRET,STUDENT_EMAIL_DOMAIN,NEXT_PUBLIC_STUDENT_EMAIL_DOMAIN&envDescription=Required%20to%20build%20and%20run%20DKU%20Life&envLink=https%3A%2F%2Fgithub.com%2FBirkleyG%2Fdku_student_site%2Fblob%2Fclaude%2Flucid-knuth-kxmnfs%2F.env.example&project-name=dku-life&repository-name=dku-life)

This repo's default branch (`claude/lucid-knuth-kxmnfs`) is what Vercel will import and build — no branch-picking needed.

1. Click the button above (or **Add New → Project** in the Vercel dashboard and import `BirkleyG/dku_student_site`).
2. When prompted for a Postgres database, add one from the **Storage** tab (Vercel's Neon/Postgres integration auto-fills `DATABASE_URL`) — or paste in a connection string from your own Postgres/Neon/Supabase instance.
3. Fill in the other env vars when prompted:
   - `AUTH_SECRET` — generate one locally with `openssl rand -base64 32`
   - `STUDENT_EMAIL_DOMAIN` and `NEXT_PUBLIC_STUDENT_EMAIL_DOMAIN` — both `dukekunshan.edu.cn`
   - `RESEND_API_KEY` is optional; without it, signup verification links are written to the deployment's function logs (Vercel dashboard → your project → Logs) instead of emailed.
4. Deploy. The build runs `prisma migrate deploy` automatically, so the database schema is created on first deploy and kept in sync on every push after that.

Every subsequent push to this branch redeploys automatically once the project is connected.

## Getting started (local dev)

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL and AUTH_SECRET
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No email provider is required in development — verification links are logged to the server console instead of sent.

## Project structure

- `src/app/(app)/` — authenticated app shell (nav) and the tab pages: `home`, `events`, `eats`, `social`, `news`, `wisdom`, `clubs`
- `src/app/api/` — route handlers (auth, events, dashboard widgets)
- `src/lib/` — Prisma client, NextAuth config, validation schemas
- `src/components/` — design system primitives (`ui/`), motion helpers (`motion/`), shell chrome (`shell/`)
- `prisma/schema.prisma` — data model

## Status

Phase 1 (foundation): onboarding, auth, Home dashboard, and Events are fully built. DKU Eats, Board, News, Wisdom, and Clubs are stubbed and next up.
