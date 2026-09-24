import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Reveal } from "@/components/motion/Reveal";
import { GuidelinesNote } from "@/components/shell/GuidelinesNote";
import { NewClubForm } from "./NewClubForm";

export default async function NewClubPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/clubs/new");

  return (
    <div className="mx-auto max-w-xl">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.3em] text-gold-bright">New club</p>
        <h1 className="mt-2 font-display text-4xl">Put it on the map.</h1>
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <NewClubForm />
        <GuidelinesNote />
      </Reveal>
    </div>
  );
}
