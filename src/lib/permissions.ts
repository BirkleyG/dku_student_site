import type { AdminScope, Role, EventCategory } from "@prisma/client";

export const ADMIN_SCOPES: { key: AdminScope; label: string; description: string }[] = [
  { key: "EVENTS", label: "Events", description: "Remove any event" },
  { key: "CLUBS", label: "Clubs", description: "Remove any club listing" },
  { key: "SPORTS", label: "Sports", description: "Remove Open Play / Tournament events" },
  { key: "NEWS", label: "News", description: "Publish and remove news articles" },
  { key: "WISDOM", label: "Wisdom", description: "Remove any wisdom post" },
  { key: "BOARD", label: "Board", description: "Remove any board post or comment" },
  { key: "EATS", label: "DKU Eats", description: "Reserved — no moderation surface yet" },
  { key: "SLB", label: "Student Leadership Board", description: "Reserved — no moderation surface yet" },
];

type PermissionUser = { role: Role; adminScopes: AdminScope[] };

/** Full ADMIN role always passes; otherwise the user needs the named scope. */
export function hasScope(user: PermissionUser, scope: AdminScope): boolean {
  return user.role === "ADMIN" || user.adminScopes.includes(scope);
}

export function isAnyAdmin(user: PermissionUser): boolean {
  return user.role === "ADMIN" || user.adminScopes.length > 0;
}

const SPORTS_CATEGORIES: EventCategory[] = ["SPORTS_OPEN_PLAY", "SPORTS_TOURNAMENTS"];

/** EVENTS scope covers every event; SPORTS scope only covers sports-category events. */
export function canModerateEvent(user: PermissionUser, category: EventCategory): boolean {
  if (hasScope(user, "EVENTS")) return true;
  if (SPORTS_CATEGORIES.includes(category)) return hasScope(user, "SPORTS");
  return false;
}
