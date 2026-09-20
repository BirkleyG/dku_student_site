import { auth } from "@/lib/auth";
import { Reveal } from "@/components/motion/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { EventsView } from "./EventsView";

export default async function EventsPage() {
  const session = await auth();

  return (
    <div>
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold-bright">Events</p>
          <h1 className="mt-2 font-display text-4xl">What&apos;s happening.</h1>
        </div>
        <LinkButton href={session ? "/events/new" : "/login"}>Host an event</LinkButton>
      </Reveal>

      <Reveal delay={0.1} className="mt-10">
        <EventsView />
      </Reveal>
    </div>
  );
}
