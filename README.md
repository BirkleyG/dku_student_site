# DKU Life

One home for everything happening at Duke Kunshan University — events, food, news, and campus wisdom.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Prisma](https://www.prisma.io) + PostgreSQL (via `@prisma/adapter-pg`)
- [NextAuth](https://authjs.dev) (credentials, JWT sessions)
- [Framer Motion](https://www.framer.com/motion/) for scroll/transition effects

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FBirkleyG%2Fdku_student_site&env=DATABASE_URL,AUTH_SECRET,NEXT_PUBLIC_STUDENT_EMAIL_DOMAINS&envDescription=Required%20to%20build%20and%20run%20DKU%20Life&envLink=https%3A%2F%2Fgithub.com%2FBirkleyG%2Fdku_student_site%2Fblob%2Fclaude%2Flucid-knuth-kxmnfs%2F.env.example&project-name=dku-life&repository-name=dku-life)

This repo's default branch (`claude/lucid-knuth-kxmnfs`) is what Vercel will import and build — no branch-picking needed. Every subsequent push to it redeploys automatically once the project is connected.

### Environment variables

| Variable | Required? | Value |
|---|---|---|
| `DATABASE_URL` | **Required** | Postgres connection string. Easiest: Vercel dashboard → **Storage** → add a Postgres (Neon) database — it fills this in for you automatically. |
| `AUTH_SECRET` | **Required** | Session encryption key. Generate one locally: `openssl rand -base64 32`, then paste it in. |
| `NEXT_PUBLIC_STUDENT_EMAIL_DOMAINS` | **Required** | Comma-separated list of email domains allowed to sign up, e.g. `dukekunshan.edu.cn,duke.edu`. |
| `RESEND_API_KEY` | Optional | Leave unset for now. Without it, signup verification links are written to the deployment's logs (Vercel dashboard → your project → **Logs**) instead of emailed — the app is fully usable this way, you just verify accounts by copying the link out of the logs. Add this later to send real emails. |
| `NEXTAUTH_URL` | Optional | Not needed on Vercel or in local dev — Auth.js trusts the request host automatically in both. Only set this if deploying somewhere else and you hit a host/auth error. |

### Steps

1. Click the button above (or **Add New → Project** in the Vercel dashboard and import `BirkleyG/dku_student_site`).
2. Add a Postgres database from the **Storage** tab (fills in `DATABASE_URL`).
3. Set `AUTH_SECRET` and `NEXT_PUBLIC_STUDENT_EMAIL_DOMAINS` per the table above. Leave `RESEND_API_KEY` blank.
4. Deploy. The build runs `prisma migrate deploy` automatically, so the database schema is created on first deploy and kept in sync on every push after that.

## Getting started (local dev)

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL and AUTH_SECRET — see table above
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
