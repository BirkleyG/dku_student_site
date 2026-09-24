import type { NotificationCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { NOTIFICATION_CATEGORY_KEYS } from "@/lib/notification-categories";

/**
 * Minimal shape this module needs from a Prisma client, so callers (and the
 * unit test in scripts/test-notification-preferences.ts) can pass a mock
 * instead of a real database connection.
 */
export type NotificationPreferenceStore = {
  notificationPreference: {
    findMany: (args: {
      where: { userId: string };
      select: { category: true; enabled: true };
    }) => Promise<{ category: NotificationCategory; enabled: boolean }[]>;
    findUnique: (args: {
      where: { userId_category: { userId: string; category: NotificationCategory } };
      select: { enabled: true };
    }) => Promise<{ enabled: boolean } | null>;
    upsert: (args: {
      where: { userId_category: { userId: string; category: NotificationCategory } };
      update: { enabled: boolean };
      create: { userId: string; category: NotificationCategory; enabled: boolean };
    }) => Promise<unknown>;
  };
};

/**
 * Opt-out default: a category with no stored row is enabled. Only an
 * explicit `enabled: false` row turns a category off.
 */
export const DEFAULT_NOTIFICATION_PREFERENCE_ENABLED = true;

/**
 * Full preference map for a user, one entry per known category, filling in
 * the opt-out default for any category that has no stored row yet.
 */
export async function getNotificationPreferences(
  userId: string,
  store: NotificationPreferenceStore = prisma,
): Promise<Record<NotificationCategory, boolean>> {
  const rows = await store.notificationPreference.findMany({
    where: { userId },
    select: { category: true, enabled: true },
  });
  const stored = new Map(rows.map((r) => [r.category, r.enabled]));

  return Object.fromEntries(
    NOTIFICATION_CATEGORY_KEYS.map((category) => [
      category,
      stored.get(category) ?? DEFAULT_NOTIFICATION_PREFERENCE_ENABLED,
    ]),
  ) as Record<NotificationCategory, boolean>;
}

/**
 * Whether a single category is enabled for a user. This is the check the
 * server-side send path should call before sending a push notification —
 * see the note in the PR description about wiring it into that path once
 * this branch merges with the push-notification infra branch.
 *
 * Defaults to enabled (opt-out model) when no preference row exists yet,
 * matching the card's "Default state: on for all categories" spec.
 */
export async function isNotificationEnabled(
  userId: string,
  category: NotificationCategory,
  store: NotificationPreferenceStore = prisma,
): Promise<boolean> {
  const pref = await store.notificationPreference.findUnique({
    where: { userId_category: { userId, category } },
    select: { enabled: true },
  });
  return pref?.enabled ?? DEFAULT_NOTIFICATION_PREFERENCE_ENABLED;
}

/**
 * Upserts one category's preference for a user. Used by the
 * notification-preferences API route.
 */
export async function setNotificationPreference(
  userId: string,
  category: NotificationCategory,
  enabled: boolean,
  store: NotificationPreferenceStore = prisma,
): Promise<void> {
  await store.notificationPreference.upsert({
    where: { userId_category: { userId, category } },
    update: { enabled },
    create: { userId, category, enabled },
  });
}
