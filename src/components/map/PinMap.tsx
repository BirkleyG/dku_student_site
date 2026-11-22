"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup, Marker } from "leaflet";
import { Crosshair, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";
import { CATEGORY_PIN_COLORS, DKU_CENTER, DKU_DEFAULT_ZOOM } from "@/lib/geo";

export type MapPin = {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  category: string;
  topicId: string;
  topicTitle?: string;
};
export type MapTopic = { id: string; title: string; category: string };
type Draft = { name: string; address: string; lat: number | null; lng: number | null };
type GeoResult = { name: string; altName: string | null; address: string; lat: number; lng: number; km: number };

// AMap road tiles: GCJ-02, fast inside mainland China, no key needed for tiles.
const TILE_URL = "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}";
const CATEGORIES = Object.keys(CATEGORY_PIN_COLORS);

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function pinHtml(color: string, size = 18) {
  return `<span style="display:block;width:${size}px;height:${size}px;background:${color};border:2px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 1px 3px rgba(0,0,0,.45)"></span>`;
}

export function PinMap({
  pins,
  topics,
  fixedTopicId,
  canAdd,
  onCreated,
}: {
  pins: MapPin[];
  topics: MapTopic[];
  /** On a topic page every new pin belongs to that topic, so the picker is hidden. */
  fixedTopicId?: string;
  canAdd: boolean;
  onCreated?: (recommendation: unknown) => void;
}) {
  const t = useT("wisdom");
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const draftMarkerRef = useRef<Marker | null>(null);
  const LRef = useRef<typeof import("leaflet") | null>(null);
  const dropModeRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [added, setAdded] = useState<MapPin[]>([]);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [panelOpen, setPanelOpen] = useState(false);
  const [dropMode, setDropMode] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [topicId, setTopicId] = useState(fixedTopicId ?? "");
  const [why, setWhy] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const allPins = useMemo(
    () => [...pins, ...added.filter((a) => !pins.some((p) => p.id === a.id))],
    [pins, added],
  );
  const visiblePins = allPins.filter((p) => !hidden.has(p.category));
  const usedCategories = CATEGORIES.filter((c) => allPins.some((p) => p.category === c));

  useEffect(() => {
    dropModeRef.current = dropMode;
    if (el.current) el.current.style.cursor = dropMode ? "crosshair" : "";
  }, [dropMode]);

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(el.current, { center: [DKU_CENTER.lat, DKU_CENTER.lng], zoom: DKU_DEFAULT_ZOOM, scrollWheelZoom: true });
      L.tileLayer(TILE_URL, { subdomains: ["1", "2", "3", "4"], maxZoom: 18, minZoom: 4, attribution: "&copy; AMap" }).addTo(map);
      L.circleMarker([DKU_CENTER.lat, DKU_CENTER.lng], { radius: 6, color: "#15221b", weight: 2, fillColor: "#fff", fillOpacity: 1 })
        .bindTooltip("DKU", { permanent: true, direction: "right", offset: [6, 0], className: "dku-map-label" })
        .addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      map.on("click", (e) => {
        if (!dropModeRef.current) return;
        setDropMode(false);
        setDraft((d) => ({ name: d?.name ?? "", address: d?.address ?? "", lat: e.latlng.lat, lng: e.latlng.lng }));
      });
      mapRef.current = map;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Render saved pins.
  useEffect(() => {
    const L = LRef.current;
    const layer = layerRef.current;
    if (!ready || !L || !layer) return;
    layer.clearLayers();
    for (const p of visiblePins) {
      const color = CATEGORY_PIN_COLORS[p.category] ?? CATEGORY_PIN_COLORS.OTHER;
      const icon = L.divIcon({ className: "", html: pinHtml(color), iconSize: [18, 18], iconAnchor: [9, 18], popupAnchor: [0, -16] });
      const topicLine = p.topicTitle
        ? `<a href="/wisdom/${esc(p.topicId)}" style="display:block;margin-top:6px;font-size:12px;color:#2e6b45">${esc(p.topicTitle)} &rarr;</a>`
        : "";
      L.marker([p.lat, p.lng], { icon, title: p.name })
        .bindPopup(
          `<strong style="font-size:14px">${esc(p.name)}</strong>` +
            `<div style="margin-top:2px;font-size:12px;color:#555">${esc(p.address || t("noAddress"))}</div>${topicLine}`,
        )
        .addTo(layer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- visiblePins is derived from these
  }, [ready, allPins, hidden, t]);

  // Draft (unsaved) pin: draggable so a search hit can be nudged onto the right door.
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;
    draftMarkerRef.current?.remove();
    draftMarkerRef.current = null;
    if (!draft || draft.lat == null || draft.lng == null) return;
    const icon = L.divIcon({ className: "", html: pinHtml("#15221b", 22), iconSize: [22, 22], iconAnchor: [11, 22] });
    const m = L.marker([draft.lat, draft.lng], { icon, draggable: true, zIndexOffset: 1000 }).addTo(map);
    m.on("dragend", () => {
      const ll = m.getLatLng();
      setDraft((d) => (d ? { ...d, lat: ll.lat, lng: ll.lng } : d));
    });
    draftMarkerRef.current = m;
    if (!map.getBounds().contains([draft.lat, draft.lng])) map.flyTo([draft.lat, draft.lng], Math.max(map.getZoom(), 16));
  }, [ready, draft]);

  const reset = () => {
    setPanelOpen(false);
    setDropMode(false);
    setDraft(null);
    setResults(null);
    setQuery("");
    setWhy("");
    setError(null);
    if (!fixedTopicId) setTopicId("");
  };

  const search = async () => {
    if (query.trim().length < 2) return;
    setSearching(true);
    setError(null);
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setSearching(false);
    if (!res || !res.ok) {
      setError(data.error ?? t("searchFailed"));
      setResults([]);
      return;
    }
    setResults(data.results ?? []);
  };

  const pick = (r: GeoResult) => {
    setDraft({ name: r.name, address: r.address, lat: r.lat, lng: r.lng });
    setResults(null);
    mapRef.current?.flyTo([r.lat, r.lng], 17);
  };

  const save = async () => {
    if (!draft) return;
    setError(null);
    if (!topicId) return setError(t("pickTopic"));
    if (draft.name.trim().length < 2 || why.trim().length < 5) return setError(t("giveNameAndReason"));
    setSaving(true);
    const res = await fetch(`/api/wisdom/${topicId}/recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeName: draft.name, address: draft.address, description: why, lat: draft.lat, lng: draft.lng }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setError(data.error ?? t("couldntAdd"));
    const rec = data.recommendation;
    const topic = topics.find((x) => x.id === topicId);
    if (rec.lat != null && rec.lng != null && topic) {
      setAdded((prev) => [
        ...prev,
        { id: rec.id, name: rec.placeName, address: rec.address, lat: rec.lat, lng: rec.lng, category: topic.category, topicId, topicTitle: fixedTopicId ? undefined : topic.title },
      ]);
    }
    onCreated?.(rec);
    reset();
  };

  const toggleCategory = (c: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });

  const inputCls = "focus-ring w-full rounded-sm border border-ink/20 bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink/35 focus:border-ink";

  return (
    <section className="border border-ink/15">
      <div className="relative isolate">
        <div ref={el} className="h-[340px] w-full bg-paper-dim sm:h-[440px]" aria-label={t("mapLabel")} />
        {canAdd && !panelOpen ? (
          <button
            onClick={() => setPanelOpen(true)}
            className="focus-ring absolute right-3 top-3 z-[500] inline-flex items-center gap-1.5 rounded-sm bg-ink px-3 py-2 text-sm font-medium text-white hover:bg-ink/85"
          >
            <Plus className="h-4 w-4" /> {t("addPin")}
          </button>
        ) : null}
        {dropMode ? (
          <div className="absolute inset-x-0 top-0 z-[500] bg-ink px-3 py-2 text-center text-sm text-white">
            {t("tapToDrop")}{" "}
            <button onClick={() => setDropMode(false)} className="ml-2 underline">{t("cancel")}</button>
          </div>
        ) : null}
      </div>

      {usedCategories.length > 0 ? (
        <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-ink/15 px-3 py-2.5 text-xs">
          {usedCategories.map((c) => (
            <button
              key={c}
              onClick={() => toggleCategory(c)}
              className={`focus-ring inline-flex items-center gap-1.5 ${hidden.has(c) ? "text-ink/35 line-through" : "text-ink/75"}`}
              aria-pressed={!hidden.has(c)}
            >
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_PIN_COLORS[c] }} />
              {t(`cat_${c}`)}
            </button>
          ))}
          <span className="ml-auto text-ink/45">{t("pinCount", { count: visiblePins.length })}</span>
        </div>
      ) : null}

      {panelOpen ? (
        <div className="border-t border-ink/15 bg-paper p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg">{t("addPinTitle")}</h3>
            <button onClick={reset} className="focus-ring p-1 text-ink/50 hover:text-ink" aria-label={t("cancel")}>
              <X className="h-4 w-4" />
            </button>
          </div>

          {!draft ? (
            <>
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void search();
                }}
              >
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchPlaceholder")} className={inputCls} autoFocus />
                <Button type="submit" disabled={searching} className="shrink-0">
                  <Search className="h-4 w-4" /> {searching ? t("searching") : t("search")}
                </Button>
              </form>
              {results ? (
                results.length === 0 ? (
                  <p className="mt-3 text-sm text-ink/55">{t("noResults")}</p>
                ) : (
                  <ul className="mt-3 divide-y divide-ink/10 border border-ink/15 bg-canvas">
                    {results.map((r, i) => (
                      <li key={`${r.lat},${r.lng},${i}`}>
                        <button onClick={() => pick(r)} className="focus-ring block w-full px-3 py-2 text-left hover:bg-paper">
                          <span className="flex items-baseline justify-between gap-3">
                            <span className="min-w-0 text-sm font-medium">
                              {r.name}
                              {r.altName ? <span className="ml-2 font-normal text-ink/50">{r.altName}</span> : null}
                            </span>
                            <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink/45">{t("kmAway", { km: r.km })}</span>
                          </span>
                          <span className="block truncate text-xs text-ink/55">{r.address}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )
              ) : null}
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <button onClick={() => setDropMode(true)} className="focus-ring inline-flex items-center gap-1.5 text-ink/75 underline-offset-2 hover:underline">
                  <Crosshair className="h-4 w-4" /> {t("dropManually")}
                </button>
                <button onClick={() => setDraft({ name: query.trim(), address: "", lat: null, lng: null })} className="focus-ring text-ink/55 underline-offset-2 hover:underline">
                  {t("addWithoutPin")}
                </button>
              </div>
            </>
          ) : (
            <div className="mt-3 space-y-3">
              <p className="text-xs text-ink/55">
                {draft.lat != null ? t("pinPlacedHint") : t("noPinHint")}{" "}
                <button onClick={() => setDraft(null)} className="underline">{t("startOver")}</button>
              </p>
              {!fixedTopicId ? (
                <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className={inputCls}>
                  <option value="">{t("pickTopicOption")}</option>
                  {topics.map((tp) => (
                    <option key={tp.id} value={tp.id}>{`${t(`cat_${tp.category}`)}: ${tp.title}`}</option>
                  ))}
                </select>
              ) : null}
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder={t("placeNamePlaceholder")} className={inputCls} />
              <input value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} placeholder={t("addressPlaceholder")} className={inputCls} />
              <textarea value={why} onChange={(e) => setWhy(e.target.value)} rows={3} placeholder={t("whyBestPlaceholder")} className={inputCls} />
              {draft.lat == null ? (
                <button onClick={() => setDropMode(true)} className="focus-ring inline-flex items-center gap-1.5 text-sm text-ink/70 hover:underline">
                  <Crosshair className="h-4 w-4" /> {t("dropManually")}
                </button>
              ) : null}
            </div>
          )}

          {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
          {draft ? (
            <Button onClick={save} disabled={saving} className="mt-4">
              {saving ? t("adding") : t("savePin")}
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
