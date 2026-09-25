import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChatApp } from "./ChatApp";

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login?callbackUrl=/chat");

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) redirect("/login?callbackUrl=/chat");

  return (
    <Suspense>
      <ChatApp currentUserId={user.id} currentUserName={session.user.name ?? "You"} />
    </Suspense>
  );
}
