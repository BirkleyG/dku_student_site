#!/usr/bin/env node
/**
 * Builds src/data/kunshan-places.json: Chinese names of roads, waterways, towns, villages and
 * neighbourhoods around DKU, from OpenStreetMap (via Overpass). The Wisdom place search uses it to
 * turn pinyin/English addresses ("Xiaolin West Road and Yuanshi Road Intersection") back into
 * Chinese ("萧林西路与元石路交叉口") before searching.
 *
 * Usage:  node scripts/build-place-gazetteer.mjs
 *         node scripts/build-place-gazetteer.mjs --cached-only   (write what's downloaded so far)
 * (Behind an HTTPS proxy on Node 22+: NODE_USE_ENV_PROXY=1 node scripts/build-place-gazetteer.mjs)
 *
 * Output rows are [name, lat, lng] (WGS-84, rounded), one per distinct name, keeping the copy
 * closest to DKU. Data © OpenStreetMap contributors, ODbL.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];
// Kunshan plus a margin (Suzhou Industrial Park edge, Huaqiao, Zhouzhuang).
const BOUNDS = { south: 31.22, north: 31.58, west: 120.75, east: 121.12 };
const GRID = 8; // public Overpass servers time out on the whole box, so fetch it in tiles
const MIN_TILE = 0.01; // degrees; a tile that keeps failing is split in four down to this size
// Finished tiles are cached here, so a run that dies halfway picks up where it stopped.
const CACHE = join(tmpdir(), "dku-place-gazetteer-v2");
const DKU = { lat: 31.4175, lng: 120.8952 };
const HAN = /\p{Script=Han}/u;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** One attempt cycle against the public mirrors; null if they all keep failing. */
async function queryTile(bb) {
  // Roads, rivers and towns/villages (place nodes). Admin boundary relations and shops/restaurants
  // make tiles too heavy for the public mirrors; AMap covers businesses.
  const query = `[out:json][timeout:50];(way["highway"]["name"](${bb});way["waterway"]["name"](${bb});node["place"]["name"](${bb}););out tags center qt;`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const url = ENDPOINTS[attempt % ENDPOINTS.length];
    try {
      const res = await fetch(url, { method: "POST", body: new URLSearchParams({ data: query }), signal: AbortSignal.timeout(80_000) });
      if (res.ok) return (await res.json()).elements;
    } catch {
      // retry below
    }
    await sleep(5000 * (attempt + 1));
  }
  return null;
}

async function mirrorsUp() {
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: "POST",
        body: new URLSearchParams({ data: '[out:json][timeout:10];node["place"="town"](31.40,120.88,31.45,120.95);out tags qt;' }),
        signal: AbortSignal.timeout(30_000),
      });
      if (res.ok) return true;
    } catch {
      // try the next mirror
    }
  }
  return false;
}

/** A tile's elements, from cache or Overpass. A tile that keeps failing is split into quarters. */
async function fetchTile([s, w, n, e]) {
  const bb = [s, w, n, e].map((x) => x.toFixed(4)).join(",");
  const file = join(CACHE, `${bb}.json`);
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  const elements = await queryTile(bb);
  if (elements) {
    writeFileSync(file, JSON.stringify(elements));
    return elements;
  }
  // If even a tiny query fails, the mirrors are down rather than this tile being too big: wait it out.
  while (!(await mirrorsUp())) {
    process.stdout.write("  Overpass mirrors are down; retrying in 2 minutes\n");
    await sleep(120_000);
  }
  const retried = await queryTile(bb);
  if (retried) {
    writeFileSync(file, JSON.stringify(retried));
    return retried;
  }
  if (n - s <= MIN_TILE) throw new Error(`Tile ${bb} failed even at the smallest size; rerun later to resume`);
  process.stdout.write(`  splitting ${bb}\n`);
  const ms = (s + n) / 2;
  const mw = (w + e) / 2;
  const quarters = [[s, w, ms, mw], [s, mw, ms, e], [ms, w, n, mw], [ms, mw, n, e]];
  const parts = [];
  for (const q of quarters) parts.push(...(await fetchTile(q)));
  return parts;
}

const dist2 = (lat, lng) => (lat - DKU.lat) ** 2 + ((lng - DKU.lng) * Math.cos((DKU.lat * Math.PI) / 180)) ** 2;

const best = new Map();
const dLat = (BOUNDS.north - BOUNDS.south) / GRID;
const dLng = (BOUNDS.east - BOUNDS.west) / GRID;
const tiles = [];
for (let i = 0; i < GRID; i++) {
  for (let j = 0; j < GRID; j++) {
    tiles.push([BOUNDS.south + i * dLat, BOUNDS.west + j * dLng, BOUNDS.south + (i + 1) * dLat, BOUNDS.west + (j + 1) * dLng]);
  }
}

mkdirSync(CACHE, { recursive: true });
const cachedOnly = process.argv.includes("--cached-only");
let done = 0;
function addElements(elements) {
  for (const el of elements) {
    const name = el.tags?.name?.trim();
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (!name || !HAN.test(name) || lat == null || lng == null) continue;
    const prev = best.get(name);
    if (!prev || dist2(lat, lng) < dist2(prev[1], prev[2])) best.set(name, [name, +lat.toFixed(5), +lng.toFixed(5)]);
  }
}
async function worker() {
  for (let bb = tiles.shift(); bb; bb = tiles.shift()) {
    addElements(await fetchTile(bb));
    process.stdout.write(`tile ${++done}/${GRID * GRID}: ${best.size} names\n`);
  }
}
if (cachedOnly) {
  for (const f of readdirSync(CACHE)) addElements(JSON.parse(readFileSync(join(CACHE, f), "utf8")));
} else {
  await worker(); // one at a time: public Overpass mirrors answer 504 to parallel requests
}

const rows = [...best.values()].sort((a, b) => a[0].localeCompare(b[0], "zh"));
const out = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "kunshan-places.json");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(rows) + "\n");
console.log(`Wrote ${rows.length} names to ${out}`);
