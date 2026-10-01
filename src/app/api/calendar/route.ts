import { NextResponse } from "next/server";
import { campusDayKey } from "@/lib/datetime";
import { buildCalendarFeed, feedToIcs, parseCampusDateParam, parseSources } from "@/lib/calendar-feed";

// Public, read-only calendar feed. Everything in it is already public on the
// site (approved events, the academic calendar, kitchen hours), so no auth.
//
//   GET /api/calendar?from=2026-10-01&to=2026-10-31&sources=events,academic,eats
//   GET /api/calendar?format=ics            (subscribe from Apple/Google/Outlook)
//
// `from`/`to` are campus dates (or ISO timestamps); default is today + 60 days
// and the range is capped at 92 days. `sources` defaults to all three.

const MAX_RANGE_DAYS = 92;
const DEFAULT_RANGE_DAYS = 60;

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" };

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = url.searchParams;

  const today = campusDayKey(new Date());
  const from = parseCampusDateParam(params.get("from")) ?? today;
  const defaultTo = new Date(Date.parse(`${from}T00:00:00Z`) + DEFAULT_RANGE_DAYS * 86_400_000).toISOString().slice(0, 10);
  const to = parseCampusDateParam(params.get("to")) ?? defaultTo;

  if (params.has("from") && !parseCampusDateParam(params.get("from"))) {
    return NextResponse.json({ error: "Invalid 'from' date" }, { status: 400, headers: CORS });
  }
  if (params.has("to") && !parseCampusDateParam(params.get("to"))) {
    return NextResponse.json({ error: "Invalid 'to' date" }, { status: 400, headers: CORS });
  }
  if (to < from) {
    return NextResponse.json({ error: "'to' must not be before 'from'" }, { status: 400, headers: CORS });
  }
  const spanDays = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000;
  if (spanDays > MAX_RANGE_DAYS) {
    return NextResponse.json({ error: `Range too large (max ${MAX_RANGE_DAYS} days)` }, { status: 400, headers: CORS });
  }

  const sources = parseSources(params.get("sources"));
  const feed = await buildCalendarFeed({ from, to, sources, baseUrl: url.origin });
  const cache = { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" };

  if (params.get("format") === "ics") {
    return new NextResponse(feedToIcs(feed), {
      headers: { ...CORS, ...cache, "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'inline; filename="dku-life.ics"' },
    });
  }
  return NextResponse.json(feed, { headers: { ...CORS, ...cache } });
}
