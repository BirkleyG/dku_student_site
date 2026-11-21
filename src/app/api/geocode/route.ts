import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session-user";
import { DKU_CENTER, wgs84ToGcj02 } from "@/lib/geo";

/**
 * Place search for the Wisdom map. Returns GCJ-02 coordinates (matches the AMap base layer).
 *  - AMAP_KEY set  -> AMap Place Text Search (best coverage of Chinese shops/addresses), biased to Kunshan.
 *  - otherwise     -> OpenStreetMap Nominatim, biased to a box around DKU, converted WGS-84 -> GCJ-02.
 * Server-side so the key stays private and Nominatim gets a proper User-Agent.
 */
export type GeoResult = { name: string; address: string; lat: number; lng: number };

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Log in to search places" }, { status: 401 });

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2 || q.length > 120) return NextResponse.json({ results: [] });

  try {
    const results = process.env.AMAP_KEY ? await searchAmap(q, process.env.AMAP_KEY) : await searchNominatim(q);
    return NextResponse.json({ results, provider: process.env.AMAP_KEY ? "amap" : "osm" });
  } catch {
    return NextResponse.json({ error: "Place search is unavailable right now. Drop the pin by hand instead." }, { status: 502 });
  }
}

async function searchAmap(q: string, key: string): Promise<GeoResult[]> {
  const url = new URL("https://restapi.amap.com/v3/place/text");
  url.search = new URLSearchParams({
    key, keywords: q, city: "昆山", citylimit: "false", offset: "8", page: "1", extensions: "base",
  }).toString();
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  const data = (await res.json()) as {
    status: string;
    pois?: { name: string; address?: string | string[]; pname?: string; cityname?: string; adname?: string; location?: string }[];
  };
  if (data.status !== "1") throw new Error("amap error");
  return (data.pois ?? []).flatMap((p) => {
    const [lng, lat] = (p.location ?? "").split(",").map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
    const street = Array.isArray(p.address) ? "" : p.address ?? "";
    return [{ name: p.name, address: [p.cityname, p.adname, street].filter(Boolean).join(" "), lat, lng }];
  });
}

async function searchNominatim(q: string): Promise<GeoResult[]> {
  const d = 0.35; // ~35 km box around campus: Kunshan, Suzhou, Shanghai edge
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.search = new URLSearchParams({
    format: "jsonv2", q, limit: "8", addressdetails: "0", "accept-language": "en,zh",
    viewbox: `${DKU_CENTER.lng - d},${DKU_CENTER.lat + d},${DKU_CENTER.lng + d},${DKU_CENTER.lat - d}`,
  }).toString();
  const res = await fetch(url, {
    headers: { "User-Agent": "DKU-Life/1.0 (student site; contact via repo)" },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error("nominatim error");
  const data = (await res.json()) as { name?: string; display_name: string; lat: string; lon: string }[];
  return data.map((r) => {
    const g = wgs84ToGcj02({ lat: Number(r.lat), lng: Number(r.lon) });
    const name = r.name || r.display_name.split(",")[0];
    return { name, address: r.display_name, lat: g.lat, lng: g.lng };
  });
}
