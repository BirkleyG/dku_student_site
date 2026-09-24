import { prisma } from "@/lib/prisma";
import { getSlbViewer, json } from "@/lib/slb";

export async function DELETE(_request: Request, ctx: RouteContext<"/api/slb/announcements/[id]">) {
  const viewer = await getSlbViewer();
  if (!viewer) return json({ error: "Log in first." }, 401);
  const { id } = await ctx.params;
  const item = await prisma.slbAnnouncement.findUnique({ where: { id }, select: { authorId: true } });
  if (!item) return json({ error: "Not found" }, 404);
  if (item.authorId !== viewer.id && !viewer.canManage) return json({ error: "Not allowed" }, 403);
  await prisma.slbAnnouncement.delete({ where: { id } });
  return json({ ok: true });
}
