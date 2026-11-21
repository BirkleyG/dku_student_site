/* Run: npx tsx scripts/test-announcement-rank.ts  (exits 1 on failure) */
import assert from "node:assert/strict";
import {
  GRACE_HOURS, MAX_HOURS, isVisible, lifetimeHours, rankAnnouncements, tally,
} from "../src/lib/announcement-rank";
import { DKU_CENTER, wgs84ToGcj02 } from "../src/lib/geo";

const now = new Date("2026-11-21T12:00:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);
let passed = 0;
const test = (name: string, fn: () => void) => { fn(); passed++; console.log("ok -", name); };

test("new post is visible during grace even when heavily downvoted", () => {
  assert.equal(isVisible({ createdAt: hoursAgo(GRACE_HOURS - 1), up: 0, down: 40 }, now), true);
});
test("heavily downvoted post disappears right after grace", () => {
  assert.equal(isVisible({ createdAt: hoursAgo(GRACE_HOURS + 0.5), up: 0, down: 5 }, now), false);
});
test("unvoted post lives the base 72h", () => {
  assert.equal(isVisible({ createdAt: hoursAgo(71), up: 0, down: 0 }, now), true);
  assert.equal(isVisible({ createdAt: hoursAgo(73), up: 0, down: 0 }, now), false);
});
test("upvotes extend lifetime, capped at 30 days", () => {
  assert.equal(isVisible({ createdAt: hoursAgo(24 * 10), up: 12, down: 0 }, now), true);
  assert.equal(lifetimeHours({ up: 1000, down: 0 }), MAX_HOURS);
});
test("downvoted post is hidden sooner than a neutral one", () => {
  assert.ok(lifetimeHours({ up: 0, down: 2 }) < lifetimeHours({ up: 0, down: 0 }));
});
test("brand-new post outranks a 2-day-old post with a few upvotes", () => {
  const ranked = rankAnnouncements([
    { id: "old", createdAt: hoursAgo(48), up: 4, down: 0 },
    { id: "new", createdAt: hoursAgo(0.2), up: 0, down: 0 },
  ], now);
  assert.deepEqual(ranked.map((r) => r.id), ["new", "old"]);
});
test("well-upvoted post beats a same-age neutral one", () => {
  const ranked = rankAnnouncements([
    { id: "meh", createdAt: hoursAgo(30), up: 0, down: 0 },
    { id: "loved", createdAt: hoursAgo(30), up: 20, down: 1 },
  ], now);
  assert.equal(ranked[0].id, "loved");
});
test("tally counts signs", () => {
  assert.deepEqual(tally([{ value: 1 }, { value: 1 }, { value: -1 }]), { up: 2, down: 1 });
});
test("WGS-84 to GCJ-02 shift near Kunshan is a few hundred metres north-east-ish", () => {
  const g = wgs84ToGcj02({ lat: 31.418, lng: 120.898 });
  assert.ok(Math.abs(g.lat - 31.418) < 0.01 && Math.abs(g.lng - 120.898) < 0.01);
  assert.ok(g.lng > 120.898);
  assert.ok(Math.abs(DKU_CENTER.lat - 31.41) < 0.05);
});
console.log(`${passed} passed`);
