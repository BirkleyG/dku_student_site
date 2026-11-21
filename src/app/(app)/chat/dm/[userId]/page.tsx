import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findOrCreateDmChannel } from "@/lib/chat";

/**
 * Deep link into a DM: /chat/dm/<userId> opens (or creates) the 1:1 channel and lands in it.
 * Used by the Announcement Board, club pages, and any other feature that wants a
 * "Message this person" button (Eats vendors, Marketplace sellers) without its own chat.
 */
export default async function DmDeepLink({ params }: PageProps<"/chat/dm/[userId]">) {
  const { userId } = await params;
  const session = await auth();
  if (!session?.user?.email) redirect(`/login?callbackUrl=${encodeURIComponent(`/chat/dm/${userId}`)}`);

  const [me, other] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
  ]);
  if (!me || !other) notFound();
  if (me.id === other.id) redirect("/chat#messages");

  const channel = await findOrCreateDmChannel(me.id, other.id);
  redirect(`/chat?channel=${channel.id}#messages`);
}
