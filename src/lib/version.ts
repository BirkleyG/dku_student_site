// Bumped by 1 on every push to the repo — see AGENTS.md / CLAUDE.md workflow
// notes. Not tied to semver; it's just a build counter for the beta.
const PATCH = 6;

export const APP_VERSION = `0.0.${String(PATCH).padStart(2, "0")}`;
