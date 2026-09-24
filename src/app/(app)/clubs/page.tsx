import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";
import { Reveal } from "@/components/motion/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { ClubsDirectory } from "./ClubsDirectory";

export default async function ClubsPage() {
  const session = await auth();
  const currentUser = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, adminScopes: true },
      })
    : null;

  return (
    <div>
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Find your people.</h1>
        </div>
        <LinkButton href={session ? "/clubs/new" : "/login"}>Add a club</LinkButton>
      </Reveal>

      <Reveal delay={0.1} className="mt-10">
        <ClubsDirectory currentUserId={currentUser?.id ?? null} isAdmin={currentUser ? hasScope(currentUser, "CLUBS") : false} />
      </Reveal>
    </div>
  );
}
