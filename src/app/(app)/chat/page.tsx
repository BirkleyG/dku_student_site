import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";
import { getT } from "@/lib/i18n/server";
import { AnnouncementBoard } from "@/components/board/AnnouncementBoard";
import { ChatApp } from "./ChatApp";

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login?callbackUrl=/chat");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, adminScopes: true },
  });
  if (!user) redirect("/login?callbackUrl=/chat");

  const t = await getT("chat");
  const now = new Date();
  const events = await prisma.event.findMany({
    where: { startsAt: { gte: new Date(now.getTime() - 86_400_000), lte: new Date(now.getTime() + 60 * 86_400_000) } },
    select: { id: true, title: true, startsAt: true },
    orderBy: { startsAt: "asc" },
    take: 80,
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-12 pt-6 sm:px-6">
      <AnnouncementBoard
        currentUserId={user.id}
        isAdmin={hasScope(user, "CHAT")}
        events={events.map((e) => ({ ...e, startsAt: e.startsAt.toISOString() }))}
      />

      <section id="messages" aria-labelledby="messages-heading" className="mt-14 scroll-mt-[calc(var(--header-h)+1rem)]">
        <div className="border-b border-ink pb-3">
          <h2 id="messages-heading" className="font-display text-3xl">{t("messagesHeading")}</h2>
          <p className="mt-1 max-w-xl text-sm text-ink/60">{t("messagesDescription")}</p>
        </div>
        <div className="mt-5">
          <Suspense>
            <ChatApp currentUserId={user.id} currentUserName={session.user.name ?? t("you")} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
