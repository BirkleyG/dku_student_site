/**
 * Standalone unit test for src/lib/notification-preferences.ts.
 *
 * The repo has no test runner configured yet, so this is a small
 * self-contained script exercising the preference-checking helpers against
 * an in-memory mock store (no live database needed). Run with:
 *
 *   npx tsx scripts/test-notification-preferences.ts
 *
 * Wiring `isNotificationEnabled` into the actual push-send path is left for
 * when this branch merges with "[Notifications] Push notification
 * infrastructure & delivery" — see the PR description.
 */
import assert from "node:assert/strict";
import type { NotificationCategory } from "@prisma/client";
import {
  DEFAULT_NOTIFICATION_PREFERENCE_ENABLED,
  getNotificationPreferences,
  isNotificationEnabled,
  setNotificationPreference,
  type NotificationPreferenceStore,
} from "../src/lib/notification-preferences";

function createMockStore(): NotificationPreferenceStore {
  const rows = new Map<string, { userId: string; category: NotificationCategory; enabled: boolean }>();
  const key = (userId: string, category: NotificationCategory) => `${userId}:${category}`;

  return {
    notificationPreference: {
      async findMany({ where }) {
        return [...rows.values()].filter((r) => r.userId === where.userId).map((r) => ({
          category: r.category,
          enabled: r.enabled,
        }));
      },
      async findUnique({ where }) {
        const row = rows.get(key(where.userId_category.userId, where.userId_category.category));
        return row ? { enabled: row.enabled } : null;
      },
      async upsert({ where, update, create }) {
        const k = key(where.userId_category.userId, where.userId_category.category);
        const existing = rows.get(k);
        rows.set(k, existing ? { ...existing, enabled: update.enabled } : create);
        return null;
      },
    },
  };
}

async function run() {
  let passed = 0;
  const test = async (name: string, fn: () => Promise<void> | void) => {
    await fn();
    passed++;
    console.log(`  ok - ${name}`);
  };

  console.log("notification-preferences:");

  await test("defaults to enabled when no row exists (opt-out model)", async () => {
    const store = createMockStore();
    assert.equal(await isNotificationEnabled("user-1", "EVENTS", store), true);
    assert.equal(DEFAULT_NOTIFICATION_PREFERENCE_ENABLED, true);
  });

  await test("respects an explicit disabled preference", async () => {
    const store = createMockStore();
    await setNotificationPreference("user-1", "ORDERS", false, store);
    assert.equal(await isNotificationEnabled("user-1", "ORDERS", store), false);
  });

  await test("toggling one category off leaves other categories enabled", async () => {
    const store = createMockStore();
    await setNotificationPreference("user-1", "ORDERS", false, store);
    assert.equal(await isNotificationEnabled("user-1", "ORDERS", store), false);
    assert.equal(await isNotificationEnabled("user-1", "EVENTS", store), true);
    assert.equal(await isNotificationEnabled("user-1", "MESSAGES", store), true);
    assert.equal(await isNotificationEnabled("user-1", "RECOMMENDATIONS", store), true);
  });

  await test("preferences are isolated per user", async () => {
    const store = createMockStore();
    await setNotificationPreference("user-1", "EVENTS", false, store);
    assert.equal(await isNotificationEnabled("user-1", "EVENTS", store), false);
    assert.equal(await isNotificationEnabled("user-2", "EVENTS", store), true);
  });

  await test("re-enabling a category after disabling it works", async () => {
    const store = createMockStore();
    await setNotificationPreference("user-1", "MESSAGES", false, store);
    assert.equal(await isNotificationEnabled("user-1", "MESSAGES", store), false);
    await setNotificationPreference("user-1", "MESSAGES", true, store);
    assert.equal(await isNotificationEnabled("user-1", "MESSAGES", store), true);
  });

  await test("getNotificationPreferences returns all four categories, defaulting missing ones on", async () => {
    const store = createMockStore();
    await setNotificationPreference("user-1", "RECOMMENDATIONS", false, store);
    const prefs = await getNotificationPreferences("user-1", store);
    assert.deepEqual(prefs, {
      EVENTS: true,
      MESSAGES: true,
      RECOMMENDATIONS: false,
      ORDERS: true,
    });
  });

  console.log(`${passed} passed`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
