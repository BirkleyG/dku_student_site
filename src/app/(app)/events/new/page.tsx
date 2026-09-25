import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Reveal } from "@/components/motion/Reveal";
import { getT } from "@/lib/i18n/server";
import { NewEventForm } from "./NewEventForm";

export default async function NewEventPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/events/new");
  const t = await getT("events");

  return (
    <div className="mx-auto max-w-xl">
      <Reveal>
        <h1 className="font-display text-4xl">{t("hostSomething")}</h1>
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <NewEventForm isAdmin={session.user.role === "ADMIN"} />
      </Reveal>
    </div>
  );
}
