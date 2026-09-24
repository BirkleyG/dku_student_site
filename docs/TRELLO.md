# Trello workflow (DKU Life board)

Feature work is tracked on the **DKU Life** Trello board: https://trello.com/b/toFdYaYT/dku-life

Use the Trello MCP tools (`mcp__Trello__*`) to read and update it.

## Lists

| List | Meaning |
| --- | --- |
| Templates | The "How this board works" guide and the task template. Never work these cards. |
| To Do | Ready to pick up. |
| Working | An agent is actively on it. |
| Completed | Merged or PR opened and done. |
| Stuck | Blocked. The latest comment says why. |

## Labels = job type

Labels are identified by color (the Trello connector can attach labels but cannot rename them).

| Color | Type | Use for |
| --- | --- | --- |
| blue | UI | Visual, layout, styling, components |
| purple | UX | Flows, usability, copy, navigation, accessibility |
| green | Backend | API routes, Prisma/DB, auth, server logic |
| orange | New Feature | A whole new capability (combine with UI/UX/Backend) |
| red | Bug | Something broken |
| yellow | Infra / Chore | Build, deploy, deps, refactors, tests, docs |

List a board's labels with `trelloReadBoard` `list_labels` to get the label IDs, then attach them with `trelloWriteCard` `attach_label`.

## Creating a card

- Put it in **To Do**. Name it `[Area] Short imperative title`, for example `[Events] Add RSVP button to event page`.
- Fill in the description using the "🧩 Task template" card in Templates: Agent, Priority, Branch, PR, Goal, Details, Done when, Conflicts with.
- Attach every label that applies.

## The card description is the spec

Each card's description holds the full instructions for that task: Goal, Current state, What to build, Done when, and Conflicts with. Birkley edits these directly in Trello to steer the work. The description overrides anything in chat or in this file for that task.

- Re-read the card (`trelloReadCard` `get`) right before you start, and again before you open a PR, in case it changed.
- Every "Done when" item has to be true before the card moves to Completed.
- If the instructions are ambiguous or conflict with the code, comment on the card with your question and move it to **Stuck**. Don't guess.
- Research cards (`Type: Research`) are finished reports. Only build from the items Birkley ticked, and split each one into its own build card first.

## When you're working a card as a sub-agent

1. Only take a card whose `Agent:` line names you or says `unassigned`. Set it to your agent name.
2. Move the card to **Working**, then comment with your branch name and session link.
3. Check **Conflicts with**. Don't edit files another card in Working owns.
4. When you finish, comment with the PR link and a one-line summary. Update the `Branch:` and `PR:` lines, then move the card to **Completed**.
5. If you're blocked, move the card to **Stuck** and comment with exactly what's needed.
