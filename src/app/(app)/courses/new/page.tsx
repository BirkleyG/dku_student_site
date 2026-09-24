import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/motion/Reveal";
import { GuidelinesNote } from "@/components/shell/GuidelinesNote";
import { NewCourseForm } from "./NewCourseForm";

export default async function NewCoursePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!session.user.verified) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="font-display text-3xl">Verify your email first</h1>
        <p className="mt-3 text-ink/60">
          Adding a course requires a verified DKU account. Check your inbox for the verification link we sent when
          you signed up.
        </p>
      </div>
    );
  }

  const professors = await prisma.professor.findMany({
    orderBy: { lastName: "asc" },
    select: { id: true, firstName: true, lastName: true, department: true },
  });

  return (
    <div className="mx-auto max-w-xl">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.3em] text-gold-bright">New course</p>
        <h1 className="mt-2 font-display text-4xl">Add it to the archive.</h1>
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <NewCourseForm professors={professors} />
        <GuidelinesNote />
      </Reveal>
    </div>
  );
}
