#!/usr/bin/env node
/**
 * Builds src/data/kunshan-places.json: Chinese names of roads, waterways, towns, villages,
 * neighbourhoods, shops, restaurants and sights around DKU, from OpenStreetMap (via Overpass). The Wisdom place search uses it to
 * turn pinyin/English addresses ("Xiaolin West Road and Yuanshi Road Intersection") back into
 * Chinese ("萧林西路与元石路交叉口") before searching.
 *
 * Usage:  node scripts/build-place-gazetteer.mjs
 * (Behind an HTTPS proxy on Node 22+: NODE_USE_ENV_PROXY=1 node scripts/build-place-gazetteer.mjs)
 *
 * Output rows are [name, lat, lng] (WGS-84, rounded), one per distinct name, keeping the copy
 * closest to DKU. Data © OpenStreetMap contributors, ODbL.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];
// Kunshan plus a margin (Suzhou Industrial Park edge, Huaqiao, Zhouzhuang).
const BOUNDS = { south: 31.22, north: 31.58, west: 120.75, east: 121.12 };
const GRID = 8; // public Overpass servers time out on the whole box, so fetch it in tiles
const DKU = { lat: 31.4175, lng: 120.8952 };
const HAN = /\p{Script=Han}/u;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchTile(bb) {
  // Roads, rivers, towns/villages (place nodes; admin boundary relations are too heavy to fetch), and
  // named shops, restaurants, malls, parks and sights so pinyin like "haidilao" finds 海底捞.
  const query = `[out:json][timeout:50];(way["highway"]["name"](${bb});way["waterway"]["name"](${bb});node["place"]["name"](${bb});nw["amenity"]["name"](${bb});nw["shop"]["name"](${bb});nw["tourism"]["name"](${bb});nw["leisure"]["name"](${bb}););out tags center qt;`;
  for (let attempt = 0; attempt < 8; attempt++) {
    const url = ENDPOINTS[attempt % ENDPOINTS.length];
    try {
      const res = await fetch(url, { method: "POST", body: new URLSearchParams({ data: query }), signal: AbortSignal.timeout(80_000) });
      if (res.ok) return (await res.json()).elements;
    } catch {
      // retry below
    }
    await sleep(5000 * (attempt + 1));
  }
  throw new Error(`Tile ${bb} failed after retries`);
}

const dist2 = (lat, lng) => (lat - DKU.lat) ** 2 + ((lng - DKU.lng) * Math.cos((DKU.lat * Math.PI) / 180)) ** 2;

const best = new Map();
const dLat = (BOUNDS.north - BOUNDS.south) / GRID;
const dLng = (BOUNDS.east - BOUNDS.west) / GRID;
const tiles = [];
for (let i = 0; i < GRID; i++) {
  for (let j = 0; j < GRID; j++) {
    tiles.push(
      [BOUNDS.south + i * dLat, BOUNDS.west + j * dLng, BOUNDS.south + (i + 1) * dLat, BOUNDS.west + (j + 1) * dLng]
        .map((n) => n.toFixed(4))
        .join(","),
    );
  }
}

let done = 0;
async function worker() {
  for (let bb = tiles.shift(); bb; bb = tiles.shift()) {
    for (const el of await fetchTile(bb)) {
      const name = el.tags?.name?.trim();
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      if (!name || !HAN.test(name) || lat == null || lng == null) continue;
      const prev = best.get(name);
      if (!prev || dist2(lat, lng) < dist2(prev[1], prev[2])) best.set(name, [name, +lat.toFixed(5), +lng.toFixed(5)]);
    }
    process.stdout.write(`tile ${++done}/${GRID * GRID}: ${best.size} names\n`);
  }
}
await worker(); // one at a time: public Overpass mirrors answer 504 to parallel requests

const rows = [...best.values()].sort((a, b) => a[0].localeCompare(b[0], "zh"));
const out = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "kunshan-places.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(rows) + "\n");
console.log(`Wrote ${rows.length} names to ${out}`);
