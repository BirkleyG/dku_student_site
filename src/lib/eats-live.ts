import { eatsApiUrl, eatsServerAuthHeader, isEatsConfigured, isEatsLinked } from "@/lib/eats-sso";
import { isOpenNow } from "@/lib/eats-hours";
import type { EatsCatalog, EatsDropRecord, EatsVendorRecord } from "@/lib/eats-calendar";
import { awardPoints } from "@/lib/points";

// Live DKU Eats data from its v2 API (birkleyg/eats, server/). Public data
// (kitchens, hours, bakes) comes from GET /api/vendors; per-person data
// (orders, shops) and anonymous activity come from /api/integrations/dku-life,
// which needs the shared secret. Every call is short and best-effort: if DKU
// Eats is slow or down, callers fall back to sample data or skip it.

export type EatsVendor = { id: string; name: string; open: boolean };
export type EatsOrderStatus = { restaurant: string; status: string; detail: string | null };
export type EatsActivityItem = { id: string; text: string; timeAgo: string };
export type EatsBusyItem = { name: string; count: number };
export type EatsLastOrder = { restaurant: string; status: string; timeAgo: string };
export type EatsWidgetData = {
  live: boolean;
  openCount: number;
  totalCount: number;
  vendors: EatsVendor[];
  order: EatsOrderStatus | null;
  activity: EatsActivityItem[];
  /** Orders placed in the last hour per kitchen (kitchens with none are absent), busiest first. */
  busy: EatsBusyItem[];
  /** The signed-in user's most recent non-cancelled order, however old. */
  lastOrder: EatsLastOrder | null;
};

export type EatsUserOrder = {
  id: string;
  code: string;
  status: string;
  vendorName: string;
  vendorSlug: string;
  pickupDate: string | null;
  pickupTime: string;
  createdAt: string;
};
export type EatsUserData = { orders: EatsUserOrder[]; shops: { id: string; slug: string; name: string }[] };
type EatsActivityOrder = { id: string; vendorName: string; createdAt: string };

const STATUS_LABELS: Record<string, string> = {
  placed: "Order received",
  preparing: "Being prepared",
  ready: "Ready for pickup",
};
// A ready order stays on the tracker for a while so you can see it's waiting.
const READY_VISIBLE_MS = 3 * 60 * 60 * 1000;
const TIMEOUT_MS = 2500;
const CATALOG_CACHE_MS = 60 * 1000;
const BUSY_WINDOW_MS = 60 * 60 * 1000;
// After a failure or timeout, skip DKU Eats for a minute so an outage costs
// one slow page load instead of slowing every visit.
const FAILURE_BACKOFF_MS = 60 * 1000;
let lastFailureAt = 0;
let catalogCache: { at: number; catalog: EatsCatalog } | null = null;

const backingOff = () => Date.now() - lastFailureAt < FAILURE_BACKOFF_MS;

export class EatsHttpError extends Error {
  constructor(public status: number, path: string) {
    super(`DKU Eats ${path} answered ${status}`);
  }
}

/**
 * GET a DKU Eats API path. Throws on failure or timeout. Only outages (network
 * errors, timeouts, 5xx) start the backoff; a 404 for one shop doesn't.
 */
export async function eatsGet<T>(path: string, { server = false } = {}): Promise<T> {
  const base = eatsApiUrl();
  if (!base) throw new Error("DKU Eats isn't configured (EATS_API_URL)");
  let res: Response;
  try {
    res = await fetch(`${base}/api${path}`, {
      headers: server ? eatsServerAuthHeader() : {},
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    lastFailureAt = Date.now();
    throw err;
  }
  if (!res.ok) {
    if (res.status >= 500) lastFailureAt = Date.now();
    throw new EatsHttpError(res.status, path);
  }
  return (await res.json()) as T;
}

function timeAgo(ms: number, now: number): string {
  const minutes = Math.max(1, Math.round((now - ms) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
}

async function loadCatalog(): Promise<EatsCatalog> {
  if (catalogCache && Date.now() - catalogCache.at < CATALOG_CACHE_MS) return catalogCache.catalog;
  const data = await eatsGet<{ vendors: EatsVendorRecord[]; drops: EatsDropRecord[] }>("/vendors");
  const catalog: EatsCatalog = {
    vendors: data.vendors.map((v) => ({
      id: v.id,
      slug: v.slug,
      name: String(v.name ?? "").trim(),
      kind: v.kind,
      hours: v.hours,
      acceptingOrders: v.acceptingOrders,
    })).filter((v) => v.name),
    drops: data.drops,
  };
  catalogCache = { at: Date.now(), catalog };
  return catalog;
}

/** Same rule as DKU Eats' own vendorStatus(): restaurants by hours, bakeries by an orderable bake. */
function vendorIsOpen(vendor: EatsVendorRecord, drops: EatsDropRecord[], now: Date): boolean {
  if (!vendor.acceptingOrders) return false;
  if (vendor.kind === "bakery") {
    return drops.some(
      (d) => d.vendorId === vendor.id && d.status === "open" && (!d.orderDeadline || new Date(d.orderDeadline) > now),
    );
  }
  return isOpenNow(vendor.hours, now);
}

async function loadUser(netId: string): Promise<EatsUserData> {
  return eatsGet<EatsUserData>(`/integrations/dku-life/users/${encodeURIComponent(netId.toLowerCase())}`, { server: true });
}

async function loadActivity(): Promise<EatsActivityOrder[]> {
  return (await eatsGet<{ orders: EatsActivityOrder[] }>("/integrations/dku-life/activity", { server: true })).orders;
}

function activeOrder(orders: EatsUserOrder[], now: number): EatsOrderStatus | null {
  const latest = orders.find(
    (o) => o.status in STATUS_LABELS && (o.status !== "ready" || now - Date.parse(o.createdAt) < READY_VISIBLE_MS),
  );
  if (!latest) return null;
  const pickup = latest.pickupTime && latest.pickupTime !== "ASAP" ? `Pickup ${latest.pickupDate ? `${latest.pickupDate} ` : ""}${latest.pickupTime}` : null;
  const details = [pickup, latest.code ? `Code ${latest.code}` : null].filter(Boolean);
  return { restaurant: latest.vendorName, status: STATUS_LABELS[latest.status], detail: details.join(" · ") || null };
}

function lastOrderOf(orders: EatsUserOrder[], now: number): EatsLastOrder | null {
  const latest = orders.find((o) => o.status !== "cancelled");
  if (!latest) return null;
  return {
    restaurant: latest.vendorName,
    status: STATUS_LABELS[latest.status] ?? "Completed",
    timeAgo: timeAgo(Date.parse(latest.createdAt), now),
  };
}

/**
 * Points sync, run when the user opens their Profile: EATS_ORDER per DKU Eats
 * order (idempotent per order id) and EATS_RUN_RESTAURANT if they manage a
 * shop. Matched by NetID, which is how DKU Eats identifies people. Never throws.
 */
export async function syncEatsPoints(user: { id: string; netId: string | null }): Promise<void> {
  if (!isEatsLinked() || !user.netId || backingOff()) return;
  try {
    const data = await loadUser(user.netId);
    for (const order of data.orders) {
      if (order.status !== "cancelled") await awardPoints(user.id, "EATS_ORDER", order.id);
    }
    if (data.shops[0]) await awardPoints(user.id, "EATS_RUN_RESTAURANT", data.shops[0].id);
  } catch (err) {
    console.error("DKU Eats points sync failed:", err);
  }
}

/** Real DKU Eats data for the home widgets, or null if Eats isn't configured or doesn't answer in time. */
export async function fetchEatsWidgetData(user: { id: string; netId: string | null } | null): Promise<EatsWidgetData | null> {
  if (!isEatsConfigured() || backingOff()) return null;
  try {
    const linked = isEatsLinked();
    const [catalog, userData, activity] = await Promise.all([
      loadCatalog(),
      linked && user?.netId ? loadUser(user.netId).catch(() => null) : Promise.resolve(null),
      linked ? loadActivity().catch(() => [] as EatsActivityOrder[]) : Promise.resolve([] as EatsActivityOrder[]),
    ]);
    const now = Date.now();
    const vendors = catalog.vendors
      .map((v) => ({ id: v.id, name: v.name, open: vendorIsOpen(v, catalog.drops, new Date(now)) }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const busyCounts = new Map<string, number>();
    for (const o of activity) {
      if (now - Date.parse(o.createdAt) > BUSY_WINDOW_MS) break;
      busyCounts.set(o.vendorName, (busyCounts.get(o.vendorName) ?? 0) + 1);
    }

    return {
      live: true,
      openCount: vendors.filter((v) => v.open).length,
      totalCount: vendors.length,
      vendors,
      order: userData ? activeOrder(userData.orders, now) : null,
      // Deliberately anonymous: only the kitchen and when, never who ordered.
      activity: activity.slice(0, 5).map((o) => ({
        id: o.id,
        text: `Someone ordered from ${o.vendorName}`,
        timeAgo: timeAgo(Date.parse(o.createdAt), now),
      })),
      busy: [...busyCounts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      lastOrder: userData ? lastOrderOf(userData.orders, now) : null,
    };
  } catch (err) {
    console.error("DKU Eats widget data failed:", err);
    return null;
  }
}

/** Kitchens and upcoming bakes for the calendar feed, or null if Eats is not configured or does not answer in time. */
export async function fetchEatsCatalogForCalendar(): Promise<EatsCatalog | null> {
  if (!isEatsConfigured() || backingOff()) return null;
  try {
    return await loadCatalog();
  } catch (err) {
    console.error("DKU Eats calendar data failed:", err);
    return null;
  }
}
