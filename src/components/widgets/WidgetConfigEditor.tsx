"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { EventCategory } from "@prisma/client";
import { EVENT_CATEGORY_GROUPS } from "@/lib/event-categories";
import { widgetCatalog, type WidgetInstance } from "@/lib/widgets";
import { wisdomCategories } from "@/lib/wisdom-validation";
import { CONVERTER_CURRENCIES } from "@/lib/widget-external";
import { navItems } from "@/lib/nav";
import type { WidgetData } from "./AppWidgetContent";
import { useT } from "@/lib/i18n/client";

const TIME_ZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Toronto", "America/Sao_Paulo",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Asia/Seoul",
  "Asia/Tokyo", "Australia/Sydney", "Pacific/Auckland",
];

const chipClass = (active: boolean) =>
  `rounded-full border px-3 py-1 text-xs transition-colors ${
    active ? "border-gold bg-gold/10 text-ink" : "border-ink/15 text-ink/50 hover:border-ink/35"
  }`;

export function WidgetConfigEditor({
  instance,
  data,
  onSave,
  onClose,
}: {
  instance: WidgetInstance;
  data: WidgetData;
  onSave: (config: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const t = useT("widgets");
  const meta = widgetCatalog[instance.kind];

  const [categories, setCategories] = useState<EventCategory[]>(
    Array.isArray(instance.config.categories) ? (instance.config.categories as EventCategory[]) : [],
  );
  const [timeframe, setTimeframe] = useState<"today" | "week">(instance.config.timeframe === "week" ? "week" : "today");
  const [restaurantName, setRestaurantName] = useState<string>(
    typeof instance.config.restaurantName === "string" ? instance.config.restaurantName : (data.eats.vendors[0]?.name ?? ""),
  );
  const [channelId, setChannelId] = useState<string>(
    typeof instance.config.channelId === "string" ? instance.config.channelId : "",
  );
  const [lilypadCategoryId, setLilypadCategoryId] = useState<number | null>(
    typeof instance.config.categoryId === "number" ? instance.config.categoryId : null,
  );

  const [wisdomCategory, setWisdomCategory] = useState<string>(
    typeof instance.config.category === "string" ? instance.config.category : "FOOD",
  );
  const [pinnedChannelId, setPinnedChannelId] = useState<string>(
    typeof instance.config.channelId === "string" ? instance.config.channelId : "general",
  );
  const [timeZone, setTimeZone] = useState<string>(
    typeof instance.config.timeZone === "string" ? instance.config.timeZone : "America/New_York",
  );
  const [currency, setCurrency] = useState<string>(typeof instance.config.currency === "string" ? instance.config.currency : "USD");
  const [hrefs, setHrefs] = useState<string[]>(
    Array.isArray(instance.config.hrefs) ? (instance.config.hrefs as string[]) : ["/events", "/eats", "/chat", "/courses"],
  );
  const navT = useT("nav");

  const toggleCategory = (key: EventCategory) => {
    setCategories((prev) => (prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]));
  };

  const save = () => {
    if (instance.kind === "EVENTS_TALLY") onSave({ categories, timeframe });
    else if (instance.kind === "EATS_FAVORITE") onSave(restaurantName ? { restaurantName } : {});
    else if (instance.kind === "CHAT_TRACKED_CHANNEL") onSave({ channelId });
    else if (instance.kind === "LILYPAD_LATEST") onSave({ categoryId: lilypadCategoryId });
    else if (instance.kind === "WISDOM_TALLY" || instance.kind === "WISDOM_NEWEST") onSave({ category: wisdomCategory });
    else if (instance.kind === "CHAT_PINNED") onSave({ channelId: pinnedChannelId });
    else if (instance.kind === "CAMPUS_DUAL_CLOCK") onSave({ timeZone });
    else if (instance.kind === "CAMPUS_CURRENCY") onSave({ currency });
    else if (instance.kind === "CAMPUS_QUICK_LINKS") onSave({ hrefs });
    else onSave({});
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl border border-ink/10 bg-paper p-5 sm:max-w-md sm:rounded-3xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">{t("configure", { label: meta.label })}</h2>
          <button onClick={onClose} className="focus-ring rounded-full p-1.5 text-ink/50 hover:text-ink" aria-label={t("close")}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {instance.kind === "EVENTS_TALLY" ? (
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{t("timeframe")}</p>
              <div className="mt-2 flex w-fit gap-1 rounded-full border border-ink/15 p-1">
                {(["today", "week"] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                      timeframe === tf ? "bg-ink text-white" : "text-ink/60 hover:text-ink"
                    }`}
                  >
                    {tf === "today" ? t("today") : t("thisWeek")}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{t("eventTypesNone")}</p>
              <div className="mt-2 max-h-56 space-y-3 overflow-y-auto pr-1">
                {EVENT_CATEGORY_GROUPS.map((g) => (
                  <div key={g.group}>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-ink/35">{g.group}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {g.categories.map((c) => {
                        const active = categories.includes(c.key);
                        return (
                          <button
                            key={c.key}
                            onClick={() => toggleCategory(c.key)}
                            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                              active ? "border-gold bg-gold/10 text-ink" : "border-ink/15 text-ink/50 hover:border-ink/35"
                            }`}
                          >
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {instance.kind === "EATS_FAVORITE" ? (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{t("favoriteRestaurant")}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {data.eats.vendors.map(({ name }) => (
                <button
                  key={name}
                  onClick={() => setRestaurantName(name)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    restaurantName === name ? "border-gold bg-gold/10 text-ink" : "border-ink/15 text-ink/50 hover:border-ink/35"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {instance.kind === "CHAT_TRACKED_CHANNEL" ? (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{t("channelToTrack")}</p>
            <div className="mt-2 max-h-56 space-y-1.5 overflow-y-auto">
              {data.chatChannels.length ? (
                data.chatChannels.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setChannelId(c.id)}
                    className={`block w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                      channelId === c.id ? "border-gold bg-gold/10 text-ink" : "border-ink/15 text-ink/70 hover:border-ink/35"
                    }`}
                  >
                    {c.name}
                  </button>
                ))
              ) : (
                <p className="text-sm text-ink/40">{t("noChannelsJoinedYet")}</p>
              )}
            </div>
          </div>
        ) : null}

        {instance.kind === "LILYPAD_LATEST" ? (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{t("category")}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                onClick={() => setLilypadCategoryId(null)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  lilypadCategoryId === null ? "border-gold bg-gold/10 text-ink" : "border-ink/15 text-ink/50 hover:border-ink/35"
                }`}
              >
                {t("all")}
              </button>
              {data.lilypadCategories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setLilypadCategoryId(c.id)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    lilypadCategoryId === c.id ? "border-gold bg-gold/10 text-ink" : "border-ink/15 text-ink/50 hover:border-ink/35"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}


        {instance.kind === "WISDOM_TALLY" || instance.kind === "WISDOM_NEWEST" ? (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{t("category")}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {wisdomCategories.map((c) => (
                <button key={c} onClick={() => setWisdomCategory(c)} className={chipClass(wisdomCategory === c)}>
                  {t(`wisdomCat_${c}`)}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {instance.kind === "CHAT_PINNED" ? (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{t("chatToPin")}</p>
            <div className="mt-2 max-h-56 space-y-1.5 overflow-y-auto">
              {data.chatChannels.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setPinnedChannelId(c.id)}
                  className={`block w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                    pinnedChannelId === c.id ? "border-gold bg-gold/10 text-ink" : "border-ink/15 text-ink/70 hover:border-ink/35"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {instance.kind === "CAMPUS_DUAL_CLOCK" ? (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{t("homeTimeZone")}</p>
            <div className="mt-2 flex max-h-56 flex-wrap gap-1.5 overflow-y-auto">
              {TIME_ZONES.map((tz) => (
                <button key={tz} onClick={() => setTimeZone(tz)} className={chipClass(timeZone === tz)}>
                  {tz.split("/").pop()?.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {instance.kind === "CAMPUS_CURRENCY" ? (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{t("convertYuanTo")}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {CONVERTER_CURRENCIES.map((c) => (
                <button key={c} onClick={() => setCurrency(c)} className={chipClass(currency === c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {instance.kind === "CAMPUS_QUICK_LINKS" ? (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/50">{t("quickLinkTabs")}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {navItems
                .filter((n) => n.href !== "/home")
                .map((n) => {
                  const active = hrefs.includes(n.href);
                  return (
                    <button
                      key={n.href}
                      onClick={() =>
                        setHrefs((prev) => (prev.includes(n.href) ? prev.filter((h) => h !== n.href) : prev.length < 8 ? [...prev, n.href] : prev))
                      }
                      className={chipClass(active)}
                    >
                      {navT(n.labelKey)}
                    </button>
                  );
                })}
            </div>
            <p className="mt-2 text-[11px] text-ink/40">{t("quickLinkLimit")}</p>
          </div>
        ) : null}

        <button
          onClick={save}
          className="focus-ring mt-5 w-full rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ink/85"
        >
          {t("save")}
        </button>
      </motion.div>
    </motion.div>
  );
}
