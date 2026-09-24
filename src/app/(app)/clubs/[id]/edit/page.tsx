import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";
import { Reveal } from "@/components/motion/Reveal";
import { ClubForm } from "../../ClubForm";

export default async function EditClubPage({ params }: PageProps<"/clubs/[id]/edit">) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) redirect(`/login?callbackUrl=/clubs/${id}/edit`);

  const [currentUser, club] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, role: true, adminScopes: true } }),
    prisma.club.findUnique({
      where: { id },
      include: { officers: true, members: { where: {}, select: { userId: true, role: true } } },
    }),
  ]);
  if (!club) notFound();

  const isManager = currentUser
    ? currentUser.id === club.submittedById ||
      club.members.some((m) => m.userId === currentUser.id && m.role === "MANAGER") ||
      hasScope(currentUser, "CLUBS")
    : false;
  if (!isManager) redirect(`/clubs/${id}`);

  return (
    <div className="mx-auto max-w-xl">
      <Reveal>
        <h1 className="font-display text-4xl">Edit {club.name}</h1>
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <ClubForm
          mode="edit"
          clubId={club.id}
          defaultValues={{
            type: club.type,
            name: club.name,
            category: club.category,
            athleticKind: club.athleticKind ?? undefined,
            sportName: club.sportName ?? "",
            description: club.description,
            contactMethod: club.contactMethod,
            contactValue: club.contactValue ?? "",
            contactQrUrl: club.contactQrUrl ?? "",
            website: club.website ?? "",
            logoUrl: club.logoUrl ?? "",
            openJoin: club.openJoin,
            officers: club.officers.length
              ? club.officers.map((o) => ({ name: o.name, title: o.title, contact: o.contact ?? "" }))
              : [{ name: "", title: "President", contact: "" }],
          }}
        />
      </Reveal>
    </div>
  );
}
