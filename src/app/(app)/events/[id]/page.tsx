import Image from "next/image";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/motion/Reveal";
import { formatEventWhen, isCampusToday } from "@/lib/datetime";
import { EVENT_CATEGORY_MAP } from "@/lib/event-categories";
import { getT } from "@/lib/i18n/server";
import { RsvpButton } from "./RsvpButton";

export default async function EventDetailPage({ params }: PageProps<"/events/[id]">) {
  const { id } = await params;
  const t = await getT("events");
  const [session, event] = await Promise.all([
    auth(),
    prisma.event.findUnique({
      where: { id },
      include: { host: { select: { firstName: true, lastName: true } }, rsvps: true },
    }),
  ]);

  if (!event) notFound();

  const currentUser = session?.user?.email
    ? await prisma.user.findUnique({ where: { email: session.user.email } })
    : null;
  const initialGoing = currentUser ? event.rsvps.some((r) => r.userId === currentUser.id) : false;

  return (
    <div className="mx-auto max-w-2xl">
      <Reveal>
        <div className="relative h-80 w-full overflow-hidden rounded-2xl bg-paper-dim sm:h-[28rem]">
          {event.posterUrl ? (
            // Posters are usually portrait: show the whole thing, never crop it.
            <Image src={event.posterUrl} alt={`Poster for ${event.title}`} fill className="object-contain" unoptimized />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-5xl italic text-ink/15">DKU</div>
          )}
        </div>
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
          style={{ backgroundColor: EVENT_CATEGORY_MAP[event.category].tint, color: EVENT_CATEGORY_MAP[event.category].color }}
        >
          {EVENT_CATEGORY_MAP[event.category].label}
        </span>
        {event.kind !== "EVENT" ? (
          <span className="ml-2 rounded-full bg-ink px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
            {event.kind === "DEADLINE" ? t("kindDeadline") : t("kindHoliday")}
          </span>
        ) : null}
        {event.allDay && isCampusToday(event.startsAt) ? (
          <p className="mt-3 rounded-xl bg-gold/10 px-4 py-2 text-sm text-ink/70">{t("headsUp")}</p>
        ) : null}
        <h1 className="mt-2 font-display text-4xl">{event.title}</h1>
        <p className="mt-2 text-ink/60">
          {formatEventWhen(event.startsAt, event.endsAt, event.allDay)} · {event.location} ·{" "}
          {t("hostedBy", { name: `${event.host.firstName} ${event.host.lastName}` })}
        </p>
      </Reveal>

      <Reveal delay={0.15} className="mt-6">
        <RsvpButton
          eventId={event.id}
          initialGoing={initialGoing}
          initialCount={event.rsvps.length}
          loggedIn={Boolean(session?.user)}
        />
      </Reveal>

      <Reveal delay={0.2} className="mt-8 whitespace-pre-wrap text-ink/75 leading-relaxed">
        {event.description}
      </Reveal>
    </div>
  );
}
