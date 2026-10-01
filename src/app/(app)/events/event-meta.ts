import { EVENT_CATEGORY_MAP } from "@/lib/event-categories";
import type { ApiEvent } from "./calendar-types";

// DKU Eats availability isn't an event category (it can't be hidden by the
// category filters); it has its own toggle and colour.
export const EATS_META = { label: "DKU Eats", color: "#2f8f6b", tint: "#dcebe4" };

export const eventMeta = (e: ApiEvent) => (e.source === "eats" ? EATS_META : EVENT_CATEGORY_MAP[e.category]);
export const eventHref = (e: ApiEvent) => (e.source === "eats" ? "/eats" : `/events/${e.id}`);
