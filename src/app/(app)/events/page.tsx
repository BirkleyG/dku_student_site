import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/motion/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { getT } from "@/lib/i18n/server";
import { Calendar } from "./Calendar";

export default async function EventsPage() {
  const session = await auth();
  const t = await getT("events");
  const user = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { hiddenEventCategories: true },
      })
    : null;

  return (
    <div>
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">{t("whatsHappening")}</h1>
        </div>
        <LinkButton href={session ? "/events/new" : "/login"}>{t("hostAnEvent")}</LinkButton>
      </Reveal>

      <Reveal delay={0.1} className="mt-10">
        <Calendar loggedIn={Boolean(session?.user)} initialHiddenCategories={user?.hiddenEventCategories ?? []} />
      </Reveal>
    </div>
  );
}
