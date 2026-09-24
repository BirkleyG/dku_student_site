import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Reveal } from "@/components/motion/Reveal";
import { GuidelinesNote } from "@/components/shell/GuidelinesNote";
import { NewCourseForm } from "./NewCourseForm";

export default async function NewCoursePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/courses/new");

  return (
    <div className="mx-auto max-w-xl">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.3em] text-gold-bright">New course</p>
        <h1 className="mt-2 font-display text-4xl">Add it to the archive.</h1>
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <NewCourseForm />
        <GuidelinesNote />
      </Reveal>
    </div>
  );
}
