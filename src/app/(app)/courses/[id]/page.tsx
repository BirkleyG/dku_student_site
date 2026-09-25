import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";
import { Reveal } from "@/components/motion/Reveal";
import { DeleteButton } from "@/components/shell/DeleteButton";
import { BackLink } from "@/components/shell/BackLink";
import { DescriptionEditor } from "./DescriptionEditor";
import { OfferingsPanel } from "./OfferingsPanel";
import { getT } from "@/lib/i18n/server";
import { ResourcesPanel } from "./ResourcesPanel";
import { CommentsPanel } from "./CommentsPanel";

export default async function CoursePage({ params }: PageProps<"/courses/[id]">) {
  const { id } = await params;
  const t = await getT("courses");
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
        comments: {
          orderBy: { createdAt: "asc" },
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
  const canEdit = Boolean(session?.user);

  return (
    <div className="mx-auto max-w-2xl">
      <Reveal>
        <BackLink href="/courses" label={t("backToCourses")} />
      </Reveal>

      <Reveal delay={0.02} className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold-bright">
            {course.department}
            {course.credits ? ` · ${t("creditsSuffix", { n: course.credits })}` : ""}
          </p>
          <h1 className="mt-2 font-display text-4xl">
            {course.code} · {course.title}
          </h1>
        </div>
        {canDelete ? <DeleteButton endpoint={`/api/courses/${course.id}`} redirectTo="/courses" /> : null}
      </Reveal>

      <Reveal delay={0.1}>
        <DescriptionEditor courseId={course.id} initialDescription={course.description} canEdit={canEdit} />
      </Reveal>

      <Reveal delay={0.12}>
        <OfferingsPanel
          courseId={course.id}
          courseDepartment={course.department}
          canEdit={canEdit}
          initialOfferings={course.offerings.map((o) => ({
            id: o.id,
            semester: o.semester,
            professor: { id: o.professor.id, firstName: o.professor.firstName, lastName: o.professor.lastName },
          }))}
        />
      </Reveal>

      <Reveal delay={0.15}>
        <ResourcesPanel
          courseId={course.id}
          currentUserId={currentUser?.id ?? null}
          canManage={canEdit}
          isAdmin={currentUser ? hasScope(currentUser, "COURSES") : false}
          initialResources={course.resources.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
        />
      </Reveal>

      <Reveal delay={0.18}>
        <CommentsPanel
          courseId={course.id}
          canComment={canEdit}
          initialComments={course.comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }))}
        />
      </Reveal>
    </div>
  );
}
