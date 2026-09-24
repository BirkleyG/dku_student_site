import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Reveal } from "@/components/motion/Reveal";
import { NewEventForm } from "./NewEventForm";

export default async function NewEventPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/events/new");

  return (
    <div className="mx-auto max-w-xl">
      <Reveal>
        <h1 className="font-display text-4xl">Host something.</h1>
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <NewEventForm isAdmin={session.user.role === "ADMIN"} />
      </Reveal>
    </div>
  );
}
