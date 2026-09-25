import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";
import { Reveal } from "@/components/motion/Reveal";
import { DeleteButton } from "@/components/shell/DeleteButton";
import { BackLink } from "@/components/shell/BackLink";
import { ReviewsPanel } from "./ReviewsPanel";

export default async function ProfessorPage({ params }: PageProps<"/professors/[id]">) {
  const { id } = await params;
  const [session, professor] = await Promise.all([
    auth(),
    prisma.professor.findUnique({
      where: { id },
      include: {
        offerings: { include: { course: true } },
        reviews: {
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { firstName: true, lastName: true } },
            course: { select: { id: true, code: true, title: true } },
          },
        },
      },
    }),
  ]);

  if (!professor) notFound();

  const currentUser = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, adminScopes: true },
      })
    : null;
  const canDelete = currentUser && (currentUser.id === professor.addedById || hasScope(currentUser, "PROFESSORS"));

  const courses = professor.offerings.map((o) => o.course).filter((c, i, a) => a.findIndex((x) => x.id === c.id) === i);

  return (
    <div className="mx-auto max-w-2xl">
      <Reveal>
        <BackLink href="/professors" label="Back to Professors" />
      </Reveal>

      <Reveal delay={0.02} className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold-bright">{professor.department}</p>
          <h1 className="mt-2 font-display text-4xl">
            {professor.firstName} {professor.lastName}
          </h1>
        </div>
        {canDelete ? <DeleteButton endpoint={`/api/professors/${professor.id}`} redirectTo="/professors" /> : null}
      </Reveal>

      {courses.length ? (
        <Reveal delay={0.1} className="mt-4 flex flex-wrap gap-2">
          {courses.map((c) => (
            <Link
              key={c.id}
              href={`/courses/${c.id}`}
              className="focus-ring rounded-full border border-ink/15 px-3 py-1.5 text-xs text-ink/70 transition-colors hover:border-gold hover:text-ink"
            >
              {c.code}
            </Link>
          ))}
        </Reveal>
      ) : null}

      <Reveal delay={0.15}>
        <ReviewsPanel
          professorId={professor.id}
          currentUserId={currentUser?.id ?? null}
          isAdmin={currentUser ? hasScope(currentUser, "PROFESSORS") : false}
          canReview={Boolean(session?.user)}
          initialReviews={professor.reviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
        />
      </Reveal>
    </div>
  );
}
