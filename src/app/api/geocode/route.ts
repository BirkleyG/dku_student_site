import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session-user";
import { DKU_CENTER, distanceKm, wgs84ToGcj02, type LatLng } from "@/lib/geo";
import { hasHan, romanize } from "@/lib/romanize";
import { interpretAddress, pinyinMatches, type Interpretation, type PlaceRef } from "@/lib/place-interpret";

/**
 * Place search for the Wisdom map. Returns GCJ-02 coordinates (matches the AMap base layer).
 *
 * Two providers run side by side and their results are merged:
 *  - AMap Place Text Search (only when AMAP_KEY is set): by far the best coverage of Chinese
 *    shops, malls and restaurants, but names and addresses come back in Chinese.
 *  - OpenStreetMap Nominatim (always): thinner coverage, but often has English names.
 * When both know a place, the English OSM name is shown with the Chinese AMap name under it.
 * Anything still only in Chinese gets sign-style pinyin (addresses, and names as a second line),
 * so it's readable without Chinese. Results are sorted by distance from DKU.
 * Pinyin/English addresses ("Xiaolin West Road and Yuanshi Road Intersection") are first turned
 * back into Chinese (see place-interpret.ts). The places they name go to the top of the list: AMap's
 * address geocoder when there's a key, the computed crossing point of two named roads, and each
 * recognised road or town on its own.
 * Server-side so the AMap key stays private and Nominatim gets a proper User-Agent.
 */
export type GeoResult = { name: string; altName: string | null; address: string; lat: number; lng: number; km: number };
type Hit = Omit<GeoResult, "km">;

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Log in to search places" }, { status: 401 });

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2 || q.length > 120) return NextResponse.json({ results: [] });

  const key = process.env.AMAP_KEY;
  const interp = interpretAddress(q);
  // Plain pinyin ("haidilao", "wanda guangchang"): known places whose pinyin starts with it.
  const pinyinHits = interp ? [] : pinyinMatches(q);
  const [amap, amapRaw, osm, amapAddress, crossing] = await Promise.allSettled([
    key ? searchAmap(interp?.chinese ?? pinyinHits[0]?.name ?? q, key) : Promise.resolve([]),
    // Our reading of the pinyin can be wrong (or the place missing from OSM), so let AMap try the original too.
    key && (interp || pinyinHits.length > 0) ? searchAmap(q, key) : Promise.resolve([]),
    searchNominatim(q),
    key && interp ? geocodeAmap(interp.chinese, key) : Promise.resolve([]),
    interp?.crossing ? crossingHit(interp) : Promise.resolve([]),
  ]);
  const labelled = [["AMap search", amap], ["AMap search (as typed)", amapRaw], ["Nominatim search", osm], ["AMap geocode", amapAddress], ["Road crossing", crossing]] as const;
  for (const [label, r] of labelled) if (r.status === "rejected") console.error(`[geocode] ${label} failed:`, r.reason);
  const ok = <T,>(r: PromiseSettledResult<T[]>) => (r.status === "fulfilled" ? r.value : []);

  // The roads/towns we recognised, unless the plain search already found the same place nearby.
  const osmHits = ok(osm);
  const named = (interp ? placeHits(interp.places) : placeHits(pinyinHits)).filter((h) => !osmHits.some((o) => distanceKm(o, h) < 1));
  const top = [...ok(amapAddress), ...ok(crossing), ...named];
  if (top.length === 0 && amap.status === "rejected" && osm.status === "rejected") {
    return NextResponse.json({ error: "Place search is unavailable right now. Drop the pin by hand instead." }, { status: 502 });
  }

  const results = merge(top, [...ok(amap), ...ok(amapRaw)], osmHits);
  return NextResponse.json({ results, interpreted: interp?.chinese ?? (pinyinHits.length > 0 ? pinyinHits.map((p) => p.name).join("、") : null), provider: key ? "amap+osm" : "osm" });
}

/**
 * `top` (direct address matches) keeps its order and leads. Then AMap first (better coverage); an OSM hit
 * within ~150 m lends it an English name, otherwise it's added on its own. The rest is sorted by distance.
 */
function merge(top: Hit[], amap: Hit[], osm: Hit[]): GeoResult[] {
  const lead: Hit[] = [];
  for (const t of top) if (!lead.some((x) => distanceKm(x, t) < 0.05)) lead.push({ ...t });
  const out: Hit[] = amap.filter((a) => !lead.some((x) => distanceKm(x, a) < 0.05)).map((a) => ({ ...a }));
  for (const o of osm) {
    if (lead.some((x) => distanceKm(x, o) < 0.05)) continue;
    const twin = out.find((a) => distanceKm(a, o) < 0.15);
    if (twin) {
      if (!hasLatin(twin.name) && hasLatin(o.name)) {
        twin.altName = twin.name;
        twin.name = o.name;
      }
      continue;
    }
    out.push(o);
  }
  const finish = (r: Hit): GeoResult => ({
    ...r,
    altName: r.altName ?? (hasHan(r.name) ? romanize(r.name) : null),
    address: hasHan(r.address) ? romanize(r.address) : r.address,
    km: Math.round(distanceKm(r, DKU_CENTER) * 10) / 10,
  });
  const rest = out.map(finish).sort((a, b) => a.km - b.km);
  return [...lead.map(finish), ...rest].slice(0, 12);
}

/** Where the two named roads meet, if OSM's geometry shows them crossing. */
async function crossingHit(interp: Interpretation): Promise<Hit[]> {
  if (!interp.crossing) return [];
  const [a, b] = interp.crossing;
  const point = await crossingPoint(a, b);
  if (!point) return [];
  return [{ name: `${a.name}与${b.name}交叉口`, altName: `${romanize(a.name)} & ${romanize(b.name)} intersection`, address: "", ...point }];
}

/** Each recognised place at its OSM centre point: towns and districts last, since they're the least specific. */
function placeHits(places: PlaceRef[]): Hit[] {
  const isArea = (name: string) => /(镇|乡|村|区|市|县|街道|社区)$/.test(name);
  const unique = [...new Map(places.map((p) => [p.name, p])).values()];
  return unique
    .sort((a, b) => Number(isArea(a.name)) - Number(isArea(b.name)))
    .map((p) => ({ name: p.name, altName: null, address: "", ...wgs84ToGcj02(p) }));
}

/** The closest approach of two roads' OSM geometries, if they come within ~150 m of each other. GCJ-02. */
async function crossingPoint(a: PlaceRef, b: PlaceRef): Promise<LatLng | null> {
  const [ga, gb] = await Promise.all([roadGeometry(a), roadGeometry(b)]);
  let best: { d: number; p: LatLng } | null = null;
  for (const lineA of ga) {
    for (const lineB of gb) {
      for (let i = 0; i + 1 < lineA.length; i++) {
        for (let j = 0; j + 1 < lineB.length; j++) {
          const c = closestBetweenSegments(lineA[i], lineA[i + 1], lineB[j], lineB[j + 1]);
          if (!best || c.d < best.d) best = c;
        }
      }
    }
  }
  return best && best.d < 0.15 ? wgs84ToGcj02(best.p) : null;
}

/** Every OSM way named like `road` near where the gazetteer places it, as WGS-84 polylines. */
async function roadGeometry(road: PlaceRef): Promise<LatLng[][]> {
  const box = 0.06;
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.search = new URLSearchParams({
    format: "jsonv2", q: road.name, limit: "20", polygon_geojson: "1", countrycodes: "cn", bounded: "1",
    viewbox: `${road.lng - box},${road.lat + box},${road.lng + box},${road.lat - box}`,
  }).toString();
  const rows = (await nominatimFetch(url)) as { geojson?: { type: string; coordinates: unknown } }[];
  const lines: LatLng[][] = [];
  for (const r of rows) {
    const g = r.geojson;
    if (!g) continue;
    const toLine = (coords: number[][]) => coords.map(([lng, lat]) => ({ lat, lng }));
    if (g.type === "LineString") lines.push(toLine(g.coordinates as number[][]));
    else if (g.type === "MultiLineString") for (const c of g.coordinates as number[][][]) lines.push(toLine(c));
  }
  return lines;
}

/** Closest points of segments p1p2 and q1q2 (flat-earth, fine at street scale). Distance in km. */
function closestBetweenSegments(p1: LatLng, p2: LatLng, q1: LatLng, q2: LatLng): { d: number; p: LatLng } {
  const kx = 111.32 * Math.cos((p1.lat * Math.PI) / 180);
  const ky = 110.57;
  const P = (v: LatLng) => ({ x: v.lng * kx, y: v.lat * ky });
  const [a, b, c, d] = [P(p1), P(p2), P(q1), P(q2)];
  const proj = (o: { x: number; y: number }, s: { x: number; y: number }, e: { x: number; y: number }) => {
    const dx = e.x - s.x, dy = e.y - s.y;
    const len = dx * dx + dy * dy;
    const t = len === 0 ? 0 : Math.max(0, Math.min(1, ((o.x - s.x) * dx + (o.y - s.y) * dy) / len));
    return { x: s.x + t * dx, y: s.y + t * dy };
  };
  // Proper crossing: segments intersect.
  const den = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
  if (den !== 0) {
    const t = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / den;
    const u = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / den;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return { d: 0, p: { lat: (a.y + t * (b.y - a.y)) / ky, lng: (a.x + t * (b.x - a.x)) / kx } };
    }
  }
  let best = { d: Infinity, p: p1 };
  for (const [o, s, e] of [[a, c, d], [b, c, d], [c, a, b], [d, a, b]] as const) {
    const q = proj(o, s, e);
    const dist = Math.hypot(o.x - q.x, o.y - q.y);
    if (dist < best.d) best = { d: dist, p: { lat: (o.y + q.y) / 2 / ky, lng: (o.x + q.x) / 2 / kx } };
  }
  return best;
}

const hasLatin = (s: string) => /[A-Za-z]/.test(s);

async function searchAmap(q: string, key: string): Promise<Hit[]> {
  const url = new URL("https://restapi.amap.com/v3/place/text");
  url.search = new URLSearchParams({
    key, keywords: q, city: "昆山", citylimit: "false", offset: "10", page: "1", extensions: "base",
  }).toString();
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  const data = (await res.json()) as {
    status: string;
    info?: string;
    pois?: { name: string; address?: string | string[]; cityname?: string; adname?: string; location?: string }[];
  };
  // A bad or unactivated key comes back as status "0" with e.g. info "INVALID_USER_KEY": log it so it shows in Vercel logs.
  if (data.status !== "1") throw new Error(`AMap ${data.info ?? "error"}`);
  return (data.pois ?? []).flatMap((p) => {
    const [lng, lat] = (p.location ?? "").split(",").map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
    const street = Array.isArray(p.address) ? "" : p.address ?? "";
    return [{ name: p.name, altName: null, address: [p.cityname, p.adname, street].filter(Boolean).join(" "), lat, lng }];
  });
}

/** AMap's structured address geocoder: good at "X路与Y路交叉口" and house numbers. */
async function geocodeAmap(address: string, key: string): Promise<Hit[]> {
  const url = new URL("https://restapi.amap.com/v3/geocode/geo");
  url.search = new URLSearchParams({ key, address, city: "昆山" }).toString();
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  const data = (await res.json()) as { status: string; info?: string; geocodes?: { formatted_address?: string; level?: string; location?: string }[] };
  if (data.status !== "1") throw new Error(`AMap ${data.info ?? "error"}`);
  return (data.geocodes ?? []).flatMap((g) => {
    const [lng, lat] = (g.location ?? "").split(",").map(Number);
    // City- or district-level answers mean AMap didn't really find the address.
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || ["国家", "省", "市", "区县"].includes(g.level ?? "")) return [];
    return [{ name: address, altName: null, address: g.formatted_address ?? "", lat, lng }];
  });
}

type NominatimRow = {
  name?: string;
  display_name: string;
  lat: string;
  lon: string;
  namedetails?: Record<string, string>;
  address?: Record<string, string>;
};

async function searchNominatim(q: string): Promise<Hit[]> {
  // Nominatim ranks by prominence, not distance, so a wide box fills up with Shanghai branches.
  // Search outward in rings and stop once there are enough: Kunshan, then Suzhou/west Shanghai, then all of China.
  const rows: NominatimRow[] = [];
  for (const box of [0.12, 0.45, null]) {
    rows.push(...(await nominatim(q, box)));
    if (rows.length >= 5) break;
  }
  const seen = new Set<string>();
  return rows.flatMap((r) => {
    const id = `${r.lat},${r.lon}`;
    if (seen.has(id)) return [];
    seen.add(id);
    const g: LatLng = wgs84ToGcj02({ lat: Number(r.lat), lng: Number(r.lon) });
    const nd = r.namedetails ?? {};
    const local = nd.name || r.name || r.display_name.split(",")[0];
    const english = nd["name:en"];
    const name = english || local;
    const altName = english && nd["name:zh"] && nd["name:zh"] !== english ? nd["name:zh"] : english && local !== english ? local : null;
    return [{ name, altName, address: shortAddress(r), lat: g.lat, lng: g.lng }];
  });
}

/** `box` is the half-width in degrees of a box around DKU (0.1° ≈ 10 km); null searches all of China. */
async function nominatim(q: string, box: number | null): Promise<NominatimRow[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  const params = new URLSearchParams({
    format: "jsonv2", q, limit: "8", addressdetails: "1", namedetails: "1", countrycodes: "cn", "accept-language": "en",
  });
  if (box !== null) {
    params.set("viewbox", `${DKU_CENTER.lng - box},${DKU_CENTER.lat + box},${DKU_CENTER.lng + box},${DKU_CENTER.lat - box}`);
    params.set("bounded", "1");
  }
  url.search = params.toString();
  return (await nominatimFetch(url)) as NominatimRow[];
}

async function nominatimFetch(url: URL): Promise<unknown[]> {
  const site = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const res = await fetch(url, {
    // Nominatim's usage policy asks for an identifying User-Agent and caching of repeat queries.
    headers: { "User-Agent": `DKU-Life/1.0 (DKU student site${site ? `; https://${site}` : ""})`, ...(site ? { Referer: `https://${site}/` } : {}) },
    signal: AbortSignal.timeout(6000),
    next: { revalidate: 86_400 },
  });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  return (await res.json()) as unknown[];
}

/** "No. 8 Duke Avenue, Yushan, Kunshan" instead of Nominatim's full province-and-postcode display name. */
function shortAddress(r: NominatimRow): string {
  const a = r.address ?? {};
  const street = [a.house_number, a.road].filter(Boolean).join(" ");
  const parts = [street, a.suburb || a.town || a.village, a.city || a.county].filter(Boolean);
  return parts.length > 0 ? [...new Set(parts)].join(", ") : r.display_name;
}
