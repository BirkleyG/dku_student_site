import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";
import { Reveal } from "@/components/motion/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { WisdomFeed } from "./WisdomFeed";

export default async function WisdomPage() {
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
          <h1 className="font-display text-4xl">The stuff only upperclassmen know.</h1>
        </div>
        <LinkButton href={session ? "/wisdom/new" : "/login"}>Add a rec</LinkButton>
      </Reveal>

      <Reveal delay={0.1} className="mt-10">
        <WisdomFeed currentUserId={currentUser?.id ?? null} isAdmin={currentUser ? hasScope(currentUser, "WISDOM") : false} />
      </Reveal>
    </div>
  );
}
