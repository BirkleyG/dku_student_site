/**
 * Map geometry helpers.
 *
 * Maps in mainland China are drawn in GCJ-02 (the "Mars" datum), not WGS-84. AMap tiles and
 * AMap search results are already GCJ-02. OpenStreetMap / Nominatim results are WGS-84 and
 * land ~500 m off on an AMap base layer unless converted. Every lat/lng we STORE is GCJ-02.
 */

export type LatLng = { lat: number; lng: number };

/** Duke Kunshan University (OSM node 31.417489,120.8952325 WGS-84, converted to GCJ-02). */
export const DKU_CENTER: LatLng = { lat: 31.41535, lng: 120.8994 };
export const DKU_DEFAULT_ZOOM = 15;

const A = 6378245.0;
const EE = 0.00669342162296594323;

function outOfChina({ lat, lng }: LatLng) {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

function transformLat(x: number, y: number) {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin((y / 3.0) * Math.PI)) * 2.0) / 3.0;
  ret += ((160.0 * Math.sin((y / 12.0) * Math.PI) + 320 * Math.sin((y * Math.PI) / 30.0)) * 2.0) / 3.0;
  return ret;
}

function transformLng(x: number, y: number) {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin((x / 3.0) * Math.PI)) * 2.0) / 3.0;
  ret += ((150.0 * Math.sin((x / 12.0) * Math.PI) + 300.0 * Math.sin((x / 30.0) * Math.PI)) * 2.0) / 3.0;
  return ret;
}

/** WGS-84 (GPS / OpenStreetMap) to GCJ-02 (AMap). Identity outside China. */
export function wgs84ToGcj02(p: LatLng): LatLng {
  if (outOfChina(p)) return p;
  let dLat = transformLat(p.lng - 105.0, p.lat - 35.0);
  let dLng = transformLng(p.lng - 105.0, p.lat - 35.0);
  const radLat = (p.lat / 180.0) * Math.PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * Math.PI);
  dLng = (dLng * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * Math.PI);
  return { lat: p.lat + dLat, lng: p.lng + dLng };
}

/** Great-circle distance in km. Fine to mix GCJ-02 and WGS-84 at this precision (they differ by ~0.5 km). */
export function distanceKm(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export function isValidLatLng(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === "number" && typeof lng === "number" &&
    Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  );
}

/** Pin colors per Wisdom category. Saturated, distinct on a light street map. */
export const CATEGORY_PIN_COLORS: Record<string, string> = {
  FOOD: "#c2410c",
  NIGHTLIFE: "#7c3aed",
  ACTIVITIES: "#0369a1",
  TRAVEL: "#0f766e",
  STUDY: "#a16207",
  BEAUTY_NATURE: "#15803d",
  OTHER: "#52525b",
};
