import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Reveal } from "@/components/motion/Reveal";
import { GuidelinesNote } from "@/components/shell/GuidelinesNote";
import { NewWisdomForm } from "./NewWisdomForm";

export default async function NewWisdomPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/wisdom/new");

  return (
    <div className="mx-auto max-w-xl">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.3em] text-gold-bright">New rec</p>
        <h1 className="mt-2 font-display text-4xl">Pass it on.</h1>
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <NewWisdomForm />
        <GuidelinesNote />
      </Reveal>
    </div>
  );
}
