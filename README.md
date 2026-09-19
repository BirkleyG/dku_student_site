# DKU Life

One home for everything happening at Duke Kunshan University — events, food, news, and campus wisdom.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Prisma](https://www.prisma.io) + PostgreSQL (via `@prisma/adapter-pg`)
- [NextAuth](https://authjs.dev) (credentials, JWT sessions)
- [Framer Motion](https://www.framer.com/motion/) for scroll/transition effects

## Getting started

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
