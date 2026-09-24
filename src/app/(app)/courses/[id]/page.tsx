import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";
import { Reveal } from "@/components/motion/Reveal";
import { DeleteButton } from "@/components/shell/DeleteButton";
import { ResourcesPanel } from "./ResourcesPanel";

export default async function CoursePage({ params }: PageProps<"/courses/[id]">) {
  const { id } = await params;
  const [session, course] = await Promise.all([
    auth(),
    prisma.course.findUnique({
      where: { id },
      include: {
        offerings: { include: { professor: true } },
        resources: {
          orderBy: { createdAt: "desc" },
          include: { author: { select: { firstName: true, lastName: true } } },
        },
      },
    }),
  ]);

  if (!course) notFound();

  const currentUser = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, adminScopes: true },
      })
    : null;
  const canDelete = currentUser && (currentUser.id === course.createdById || hasScope(currentUser, "COURSES"));

  return (
    <div className="mx-auto max-w-2xl">
      <Reveal className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold-bright">{course.department}</p>
          <h1 className="mt-2 font-display text-4xl">
            {course.code} · {course.title}
          </h1>
        </div>
        {canDelete ? <DeleteButton endpoint={`/api/courses/${course.id}`} redirectTo="/courses" /> : null}
      </Reveal>

      {course.description ? (
        <Reveal delay={0.1} className="mt-6 leading-relaxed text-ink/80">
          {course.description}
        </Reveal>
      ) : null}

      <Reveal delay={0.12} className="mt-6 flex flex-wrap gap-2">
        {course.offerings.length ? (
          course.offerings.map((o) => (
            <Link
              key={o.id}
              href={`/professors/${o.professor.id}`}
              className="focus-ring rounded-full border border-ink/15 px-3 py-1.5 text-xs text-ink/70 transition-colors hover:border-gold hover:text-ink"
            >
              {o.professor.firstName} {o.professor.lastName} · {o.semester}
            </Link>
          ))
        ) : (
          <p className="text-sm text-ink/40">No professor linked yet.</p>
        )}
      </Reveal>

      <Reveal delay={0.15}>
        <ResourcesPanel
          courseId={course.id}
          currentUserId={currentUser?.id ?? null}
          canManage={Boolean(session?.user?.verified)}
          isAdmin={currentUser ? hasScope(currentUser, "COURSES") : false}
          initialResources={course.resources.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
        />
      </Reveal>
    </div>
  );
}
