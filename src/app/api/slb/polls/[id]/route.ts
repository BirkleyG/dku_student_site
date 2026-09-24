import { prisma } from "@/lib/prisma";
import { getSlbViewer, json } from "@/lib/slb";

export async function DELETE(_request: Request, ctx: RouteContext<"/api/slb/polls/[id]">) {
  const viewer = await getSlbViewer();
  if (!viewer) return json({ error: "Log in first." }, 401);
  const { id } = await ctx.params;
  const poll = await prisma.slbPoll.findUnique({ where: { id }, select: { authorId: true } });
  if (!poll) return json({ error: "Not found" }, 404);
  if (poll.authorId !== viewer.id && !viewer.canManage) return json({ error: "Not allowed" }, 403);
  await prisma.slbPoll.delete({ where: { id } });
  return json({ ok: true });
}
