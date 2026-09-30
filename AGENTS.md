<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# DKU works in Sessions, not just semesters

DKU's academic year is built from **7-week Sessions**. Always think and write in Sessions first; "semester" is only a grouping of two Sessions.

| Session | Semester |
| --- | --- |
| S1 | Fall |
| S2 | Fall |
| S3 | Spring |
| S4 | Spring |

- One academic year = S1, S2, S3, S4. Fall Semester = S1 + S2; Spring Semester = S3 + S4.
- Courses, ratings, deadlines and "end of term" moments usually happen per Session, so don't assume a whole semester when a feature is about a class or a term.
- Naming gotcha: `src/lib/academic-calendar.ts` keys Spring's Sessions as `spring-s1` and `spring-s2` (labels "Spring Session 1/2"). Those are S3 and S4. When adding or changing anything user-facing, say S3/S4, not "Spring Session 1/2".
- Spring also has a one-week Mini-Term between S3 and S4 (`spring-mini`). It is not a Session.
