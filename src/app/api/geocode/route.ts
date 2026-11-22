import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session-user";
import { DKU_CENTER, distanceKm, wgs84ToGcj02, type LatLng } from "@/lib/geo";
import { hasHan, romanize } from "@/lib/romanize";

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
  const [amap, osm] = await Promise.allSettled([key ? searchAmap(q, key) : Promise.resolve([]), searchNominatim(q)]);
  if (amap.status === "rejected") console.error("[geocode] AMap search failed:", amap.reason);
  if (osm.status === "rejected") console.error("[geocode] Nominatim search failed:", osm.reason);
  if (amap.status === "rejected" && osm.status === "rejected") {
    return NextResponse.json({ error: "Place search is unavailable right now. Drop the pin by hand instead." }, { status: 502 });
  }

  const results = merge(amap.status === "fulfilled" ? amap.value : [], osm.status === "fulfilled" ? osm.value : []);
  return NextResponse.json({ results, provider: key ? "amap+osm" : "osm" });
}

/** AMap first (better coverage); an OSM hit within ~150 m lends it an English name, otherwise it's added on its own. */
function merge(amap: Hit[], osm: Hit[]): GeoResult[] {
  const out: Hit[] = amap.map((a) => ({ ...a }));
  for (const o of osm) {
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
  return out
    .map((r) => ({
      ...r,
      altName: r.altName ?? (hasHan(r.name) ? romanize(r.name) : null),
      address: hasHan(r.address) ? romanize(r.address) : r.address,
      km: Math.round(distanceKm(r, DKU_CENTER) * 10) / 10,
    }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 12);
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
  const site = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const res = await fetch(url, {
    // Nominatim's usage policy asks for an identifying User-Agent and caching of repeat queries.
    headers: { "User-Agent": `DKU-Life/1.0 (DKU student site${site ? `; https://${site}` : ""})`, ...(site ? { Referer: `https://${site}/` } : {}) },
    signal: AbortSignal.timeout(6000),
    next: { revalidate: 86_400 },
  });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  return (await res.json()) as NominatimRow[];
}

/** "No. 8 Duke Avenue, Yushan, Kunshan" instead of Nominatim's full province-and-postcode display name. */
function shortAddress(r: NominatimRow): string {
  const a = r.address ?? {};
  const street = [a.house_number, a.road].filter(Boolean).join(" ");
  const parts = [street, a.suburb || a.town || a.village, a.city || a.county].filter(Boolean);
  return parts.length > 0 ? [...new Set(parts)].join(", ") : r.display_name;
}
