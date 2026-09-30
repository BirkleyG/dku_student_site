import { ArrowUpRight, BookOpen, Clock, DoorOpen, Music, Presentation, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import { getT } from "@/lib/i18n/server";

// DKU's EMS sends `X-Frame-Options: SAMEORIGIN` and requires a NetID login, so
// it can't be iframed or read server-side; we link out to it instead.
const EMS_URL = "https://dukekunshan.emscloudservice.com/web/BrowseForSpace.aspx";
const IT_GUIDE_URL = "https://it.dukekunshan.edu.cn/book-rooms-and-workshops-via-ems-web-app/";
const IT_ANNOUNCEMENT_URL = "https://it.dukekunshan.edu.cn/announcements/self-service-room-booking-now-available/";
const IT_WHO_CAN_BOOK_URL = "https://it.dukekunshan.edu.cn/who-can-book-what-rooms/";

const ROOM_TYPES: { key: string; icon: LucideIcon }[] = [
  { key: "study", icon: BookOpen },
  { key: "dataviz", icon: Presentation },
  { key: "meeting", icon: Users },
  { key: "music", icon: Music },
];

const linkClass = "focus-ring inline-flex items-center gap-1 text-ink/70 underline underline-offset-4 hover:text-ink";

export default async function RoomsPage() {
  const t = await getT("rooms");

  return (
    <div>
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">{t("pageTitle")}</h1>
          <p className="mt-2 max-w-lg text-ink/60">{t("pageDescription")}</p>
        </div>
        <a
          href={EMS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-85"
        >
          <DoorOpen size={16} aria-hidden />
          {t("bookNow")}
          <ArrowUpRight size={14} aria-hidden />
        </a>
      </Reveal>
      <p className="mt-3 max-w-lg text-xs text-ink/45">{t("signInNote")}</p>

      <Reveal delay={0.1} className="mt-10">
        <h2 className="font-display text-2xl">{t("typesHeading")}</h2>
        <div data-tour="rooms-types" className="mt-4 grid gap-4 sm:grid-cols-2">
          {ROOM_TYPES.map(({ key, icon: Icon }) => (
            <a key={key} href={EMS_URL} target="_blank" rel="noopener noreferrer" className="focus-ring block">
              <Card className="h-full transition-transform duration-300 hover:-translate-y-0.5">
                <Icon size={22} className="text-ink/60" aria-hidden />
                <h3 className="mt-3 font-display text-xl">{t(`type_${key}_name`)}</h3>
                <p className="mt-1 text-sm text-ink/60">{t(`type_${key}_desc`)}</p>
                <dl className="mt-4 space-y-1.5 text-xs text-ink/60">
                  {(["max", "window", "hours"] as const).map((field) => (
                    <div key={field} className="flex gap-2">
                      <dt className="flex w-24 shrink-0 items-center gap-1 text-ink/45">
                        {field === "hours" ? <Clock size={12} aria-hidden /> : null}
                        {t(field === "max" ? "maxDuration" : field === "window" ? "window" : "hours")}
                      </dt>
                      <dd>{t(`type_${key}_${field}`)}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            </a>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.15} className="mt-10">
        <h2 className="font-display text-2xl">{t("rulesHeading")}</h2>
        <ul className="mt-3 max-w-2xl list-disc space-y-2 pl-5 text-sm text-ink/70">
          <li>{t("rule1")}</li>
          <li>{t("rule2")}</li>
          <li>{t("rule3")}</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <a href={IT_WHO_CAN_BOOK_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {t("fullList")} <ArrowUpRight size={12} aria-hidden />
          </a>
          <a href={IT_GUIDE_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {t("howTo")} <ArrowUpRight size={12} aria-hidden />
          </a>
          <a href={IT_ANNOUNCEMENT_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
            {t("announcement")} <ArrowUpRight size={12} aria-hidden />
          </a>
        </div>
        <p className="mt-6 text-xs text-ink/40">{t("source")}</p>
      </Reveal>
    </div>
  );
}
