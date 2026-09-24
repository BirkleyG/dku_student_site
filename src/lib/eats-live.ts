import { getFirestore, type Firestore, type Timestamp } from "firebase-admin/firestore";
import { getEatsAdminApp, isEatsConfigured } from "@/lib/eats-sso";
import { isOpenNow } from "@/lib/eats-hours";

// Reads DKU Eats' Firestore directly with the same service account DKU Life
// already uses for SSO, so the home widgets show real kitchens and orders.

export type EatsVendor = { id: string; name: string; open: boolean };
export type EatsOrderStatus = { restaurant: string; status: string; detail: string | null };
export type EatsActivityItem = { id: string; text: string; timeAgo: string };
export type EatsWidgetData = {
  live: boolean;
  openCount: number;
  totalCount: number;
  vendors: EatsVendor[];
  order: EatsOrderStatus | null;
  activity: EatsActivityItem[];
};

const STATUS_LABELS: Record<string, string> = {
  incoming: "Order received",
  tofire: "In the queue",
  onfire: "Being prepared",
  done: "Ready for pickup",
};
// A finished order stays on the tracker for a while so you can see it's ready.
const DONE_VISIBLE_MS = 3 * 60 * 60 * 1000;
const TIMEOUT_MS = 2500;
const VENDOR_CACHE_MS = 60 * 1000;
// After a failure or timeout, skip DKU Eats for a minute so an outage costs
// one slow home-page load instead of slowing every visit.
const FAILURE_BACKOFF_MS = 60 * 1000;
let lastFailureAt = 0;

let vendorCache: { at: number; vendors: { id: string; name: string; hours: unknown }[] } | null = null;

function db(): Firestore {
  return getFirestore(getEatsAdminApp());
}

function toMillis(value: unknown): number {
  if (value && typeof (value as Timestamp).toMillis === "function") return (value as Timestamp).toMillis();
  if (typeof value === "number") return value;
  return 0;
}

function timeAgo(ms: number, now: number): string {
  const minutes = Math.max(1, Math.round((now - ms) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
}

async function loadVendors() {
  if (vendorCache && Date.now() - vendorCache.at < VENDOR_CACHE_MS) return vendorCache.vendors;
  const snap = await db().collection("vendors").select("name", "hours", "approved", "display").get();
  const vendors = snap.docs
    // Same rule the DKU Eats app uses for its own kitchen list.
    .filter((doc) => doc.get("approved") !== false && doc.get("display") !== false)
    .map((doc) => ({ id: doc.id, name: String(doc.get("name") ?? "").trim(), hours: doc.get("hours") }))
    .filter((v) => v.name)
    .sort((a, b) => a.name.localeCompare(b.name));
  vendorCache = { at: Date.now(), vendors };
  return vendors;
}

async function loadActiveOrder(uid: string | null, netId: string | null): Promise<EatsOrderStatus | null> {
  const orders = db().collection("orders");
  const fields = ["vendorName", "status", "createdAt", "pickupTime", "orderCode"] as const;
  // Queried by one field each and sorted here, so no composite index is needed.
  const queries = [
    uid ? orders.where("customerUid", "==", uid).select(...fields).limit(20).get() : null,
    netId ? orders.where("customerNetId", "==", netId).select(...fields).limit(20).get() : null,
  ].filter((q): q is NonNullable<typeof q> => q !== null);
  if (queries.length === 0) return null;

  const now = Date.now();
  const seen = new Set<string>();
  const candidates = (await Promise.all(queries))
    .flatMap((snap) => snap.docs)
    .filter((doc) => (seen.has(doc.id) ? false : (seen.add(doc.id), true)))
    .map((doc) => ({
      restaurant: String(doc.get("vendorName") ?? "DKU Eats"),
      status: String(doc.get("status") ?? ""),
      createdAt: toMillis(doc.get("createdAt")),
      pickupTime: doc.get("pickupTime"),
      orderCode: doc.get("orderCode"),
    }))
    .filter((o) => o.status in STATUS_LABELS && (o.status !== "done" || now - o.createdAt < DONE_VISIBLE_MS))
    .sort((a, b) => b.createdAt - a.createdAt);

  const latest = candidates[0];
  if (!latest) return null;
  const details = [
    typeof latest.pickupTime === "string" && latest.pickupTime ? `Pickup ${latest.pickupTime}` : null,
    latest.orderCode ? `Code ${latest.orderCode}` : null,
  ].filter(Boolean);
  return { restaurant: latest.restaurant, status: STATUS_LABELS[latest.status], detail: details.join(" · ") || null };
}

async function loadActivity(): Promise<EatsActivityItem[]> {
  const snap = await db().collection("orders").orderBy("createdAt", "desc").select("vendorName", "createdAt").limit(5).get();
  const now = Date.now();
  // Deliberately anonymous: only the kitchen and when, never who ordered.
  return snap.docs.map((doc) => ({
    id: doc.id,
    text: `Someone ordered from ${String(doc.get("vendorName") ?? "a DKU Eats kitchen")}`,
    timeAgo: timeAgo(toMillis(doc.get("createdAt")), now),
  }));
}

/** Real DKU Eats data for the home widgets, or null if Eats isn't configured or doesn't answer in time. */
export async function fetchEatsWidgetData(user: { id: string; netId: string | null } | null): Promise<EatsWidgetData | null> {
  if (!isEatsConfigured()) return null;
  if (Date.now() - lastFailureAt < FAILURE_BACKOFF_MS) return null;

  const work = (async () => {
    const [vendors, order, activity] = await Promise.all([
      loadVendors(),
      user ? loadActiveOrder(user.id, user.netId) : Promise.resolve(null),
      loadActivity(),
    ]);
    const now = new Date();
    const withStatus = vendors.map((v) => ({ id: v.id, name: v.name, open: isOpenNow(v.hours, now) }));
    return {
      live: true,
      openCount: withStatus.filter((v) => v.open).length,
      totalCount: withStatus.length,
      vendors: withStatus,
      order,
      activity,
    } satisfies EatsWidgetData;
  })();

  try {
    const result = await Promise.race([
      work,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS)),
    ]);
    if (!result) lastFailureAt = Date.now();
    return result;
  } catch (err) {
    lastFailureAt = Date.now();
    console.error("DKU Eats widget data failed:", err);
    return null;
  }
}
