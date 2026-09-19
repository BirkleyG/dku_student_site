import Image from "next/image";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/motion/Reveal";
import { RsvpButton } from "./RsvpButton";

export default async function EventDetailPage({ params }: PageProps<"/events/[id]">) {
  const { id } = await params;
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
        <div className="relative h-64 w-full overflow-hidden rounded-3xl bg-surface-raised sm:h-80">
          {event.posterUrl ? (
            <Image src={event.posterUrl} alt="" fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-5xl text-paper/15">DKU</div>
          )}
        </div>
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">
          {format(event.startsAt, "EEEE, MMMM d · h:mm a")} – {format(event.endsAt, "h:mm a")}
        </p>
        <h1 className="mt-2 font-display text-4xl font-medium">{event.title}</h1>
        <p className="mt-2 text-paper/60">
          {event.location} · Hosted by {event.host.firstName} {event.host.lastName}
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

      <Reveal delay={0.2} className="mt-8 whitespace-pre-wrap text-paper/75 leading-relaxed">
        {event.description}
      </Reveal>
    </div>
  );
}
