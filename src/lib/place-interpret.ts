import { pinyin } from "pinyin-pro";
import gazetteer from "@/data/kunshan-places.json";
import { DKU_CENTER, distanceKm } from "@/lib/geo";

/**
 * Turns a pinyin / English address into Chinese so map search can find it, e.g.
 *   "Yushanzhen Xiaolin West Road and Yuanshi Road Intersection, Nanyaohe East Side No.1 House"
 *   -> "玉山镇萧林西路与元石路交叉口南瑶河东侧1号"
 *
 * Map APIs only index Chinese names, so the words are matched against the pinyin of real
 * road/town/village/river names around DKU (src/data/kunshan-places.json, built from
 * OpenStreetMap by scripts/build-place-gazetteer.mjs). English words for road types and
 * directions are folded into pinyin first ("West Road" -> "xilu").
 */

export type PlaceRef = { name: string; lat: number; lng: number };
export type Interpretation = {
  /** The whole address in Chinese, for providers that parse addresses (AMap). */
  chinese: string;
  /** Each matched road or place, in order. */
  places: PlaceRef[];
  /** "X and Y intersection": the two roads that cross. */
  crossing: [PlaceRef, PlaceRef] | null;
};

const HAN = /\p{Script=Han}/u;
const MIN_KEY = 4; // shorter keys ("lu", "he") match by accident inside other words
const MAX_KEY = 40;

let index: Map<string, PlaceRef[]> | null = null;

const keyOf = (name: string) =>
  pinyin(name, { toneType: "none", type: "array", nonZh: "removed" })
    .join("")
    .toLowerCase()
    .replace(/ü|v/g, "u")
    .replace(/[^a-z0-9]/g, "");

function getIndex() {
  if (index) return index;
  index = new Map();
  for (const [name, lat, lng] of gazetteer as [string, number, number][]) {
    if (!HAN.test(name)) continue;
    const key = keyOf(name);
    if (key.length < MIN_KEY || key.length > MAX_KEY) continue;
    const list = index.get(key) ?? [];
    list.push({ name, lat, lng });
    index.set(key, list);
  }
  // Towns and villages are often written without their suffix ("Zhouzhuang" for 周庄镇).
  for (const [name, lat, lng] of gazetteer as [string, number, number][]) {
    const base = name.replace(/(街道|社区|镇|乡|村|区|市|县)$/, "");
    if (base === name || !HAN.test(base)) continue;
    const key = keyOf(base);
    if (key.length < MIN_KEY || index.has(key)) continue;
    index.set(key, [{ name, lat, lng }]);
  }
  // Same pinyin, different characters (homophones): prefer the one nearest campus.
  for (const list of index.values()) list.sort((a, b) => distanceKm(a, DKU_CENTER) - distanceKm(b, DKU_CENTER));
  return index;
}

// English -> pinyin for the generic parts of Chinese addresses. Longest phrases first.
const DIRS: Record<string, string> = {
  east: "dong", west: "xi", south: "nan", north: "bei", e: "dong", w: "xi", s: "nan", n: "bei",
  middle: "zhong", mid: "zhong", central: "zhong", center: "zhong",
};
const TYPES: Record<string, string> = {
  road: "lu", rd: "lu", street: "jie", st: "jie", avenue: "dadao", ave: "dadao", boulevard: "dadao", blvd: "dadao",
  lane: "xiang", alley: "xiang", town: "zhen", township: "zhen", village: "cun", district: "qu", city: "shi", county: "xian",
  river: "he", creek: "he", lake: "hu", bridge: "qiao", park: "gongyuan", community: "shequ", station: "zhan",
};
const SIDE: Record<string, string> = { east: "东侧", west: "西侧", south: "南侧", north: "北侧" };

type Token = { kind: "text"; text: string } | { kind: "and" } | { kind: "cross" } | { kind: "literal"; text: string };

function tokenize(input: string): Token[] {
  let s = ` ${input.toLowerCase().replace(/[’']/g, "")} `;
  s = s.replace(/\bno\.?\s*(\d+)\b|#\s*(\d+)\b/g, (_, a, b) => ` @${a ?? b}号@ `);
  s = s.replace(/\b(house|building|bldg|unit|room)\b/g, " ");
  s = s.replace(/\b(east|west|south|north)\s+side\b/g, (_, d: string) => ` @${SIDE[d]}@ `);
  s = s.replace(/\b(intersection|junction|crossing|crossroads?|corner)\b(\s+of)?/g, " ^ ");
  s = s.replace(/\s(and|&|\/|with)\s/g, " + ");
  s = s.replace(/\b(east|west|south|north|e|w|s|n|middle|mid|central|center)\.?\s+(road|rd|street|st)\b/g, (_, d: string, t: string) => ` ${DIRS[d]}${TYPES[t]} `);
  s = s.replace(new RegExp(`\\b(${Object.keys(TYPES).join("|")})\\b\\.?`, "g"), (_, t: string) => ` ${TYPES[t]} `);
  s = s.replace(/(^|\s)(\d+)(?=\s)/g, (_, sp: string, n: string) => `${sp}@${n}号@`); // "Qianjin Xilu 1801" -> 1801号

  const tokens: Token[] = [];
  for (const part of s.split(/(@[^@]+@|\^|\+|[,;，、])/)) {
    if (!part || !part.trim()) continue;
    if (part.startsWith("@")) tokens.push({ kind: "literal", text: part.slice(1, -1) });
    else if (part === "^") tokens.push({ kind: "cross" });
    else if (part === "+") tokens.push({ kind: "and" });
    else if (/^[,;，、]$/.test(part)) continue;
    else tokens.push({ kind: "text", text: part });
  }
  return tokens;
}

/**
 * Greedy longest-match of gazetteer keys across a run of words, ignoring the spaces between them
 * ("xiao lin xilu" and "xiaolinxilu" both work). A match must start and end on word boundaries,
 * so "coffeeshop" can't hit a place whose pinyin happens to be inside it.
 */
function matchRun(text: string): { hits: PlaceRef[]; letters: number; matched: number } {
  const idx = getIndex();
  const words = text.split(/[^a-z0-9]+/).filter(Boolean);
  const s = words.join("");
  const bounds = new Set<number>([0]);
  let pos = 0;
  for (const w of words) bounds.add((pos += w.length));

  const hits: PlaceRef[] = [];
  let matched = 0;
  let i = 0;
  while (i < s.length) {
    let len = Math.min(MAX_KEY, s.length - i);
    let hit: PlaceRef | null = null;
    for (; len >= MIN_KEY; len--) {
      if (!bounds.has(i + len)) continue;
      const list = idx.get(s.slice(i, i + len));
      if (list) {
        hit = list[0];
        break;
      }
    }
    if (hit) {
      hits.push(hit);
      matched += len;
      i += len;
    } else {
      // Skip to the next word.
      let next = i + 1;
      while (next < s.length && !bounds.has(next)) next++;
      i = next;
    }
  }
  return { hits, letters: s.replace(/[0-9]/g, "").length, matched };
}

/** Null when the query already has Chinese, or no known place name was recognised. */
export function interpretAddress(query: string): Interpretation | null {
  if (HAN.test(query) || !/[a-z]/i.test(query)) return null;
  const tokens = tokenize(query);
  const places: PlaceRef[] = [];
  const parts: string[] = [];
  const partOf: number[] = []; // parts index of each place
  let joinedAt = -1; // places index right after an "and"
  let crossSeen = false;
  let letters = 0;
  let matched = 0;

  for (const tok of tokens) {
    if (tok.kind === "text") {
      const run = matchRun(tok.text);
      letters += run.letters;
      matched += run.matched;
      for (const h of run.hits) {
        places.push(h);
        partOf.push(parts.length);
        parts.push(h.name);
      }
    } else if (tok.kind === "and") {
      if (places.length > 0 && joinedAt < 0) {
        parts.push("与");
        joinedAt = places.length;
      }
    } else if (tok.kind === "cross") {
      crossSeen = true;
    } else {
      parts.push(tok.text);
    }
  }

  // "X and Y intersection" or "corner of X and Y": 交叉口 goes right after the second road.
  // Two roads joined by "and" mean the same thing even without the word "intersection".
  const isRoad = (p?: PlaceRef) => !!p && /(路|街|道|巷|弄)$/.test(p.name);
  const paired = joinedAt > 0 && places.length > joinedAt;
  if (paired && isRoad(places[joinedAt - 1]) && isRoad(places[joinedAt])) crossSeen = true;
  let crossing: [PlaceRef, PlaceRef] | null = null;
  if (crossSeen && paired) {
    crossing = [places[joinedAt - 1], places[joinedAt]];
    parts.splice(partOf[joinedAt] + 1, 0, "交叉口");
  } else if (crossSeen) {
    parts.push("交叉口");
  }

  // Mostly unrecognised words ("Starbucks near Duke Avenue") are a search, not an address: leave it alone.
  if (places.length === 0 || matched < letters * 0.6) return null;
  const chinese = parts.join("").replace(/^与|与$/g, "").replace(/与(?=交叉口|$)/, "");
  return { chinese, places, crossing };
}

/**
 * Places whose pinyin starts with what was typed, nearest DKU first: "zhouzhuang" -> 周庄镇.
 * For plain pinyin searches that aren't an address. Needs at least 5 letters to avoid noise.
 */
export function pinyinMatches(query: string, limit = 5): PlaceRef[] {
  if (HAN.test(query)) return [];
  const compact = query.toLowerCase().replace(/[^a-z]/g, "");
  if (compact.length < 5) return [];
  const out: PlaceRef[] = [];
  for (const [key, list] of getIndex()) if (key.startsWith(compact)) out.push(...list);
  return [...new Map(out.map((p) => [p.name, p])).values()]
    .sort((a, b) => distanceKm(a, DKU_CENTER) - distanceKm(b, DKU_CENTER))
    .slice(0, limit);
}
