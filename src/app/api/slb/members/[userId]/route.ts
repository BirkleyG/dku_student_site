import { prisma } from "@/lib/prisma";
import { getSlbViewer, json } from "@/lib/slb";

export async function DELETE(_request: Request, ctx: RouteContext<"/api/slb/members/[userId]">) {
  const viewer = await getSlbViewer();
  if (!viewer) return json({ error: "Log in first." }, 401);
  if (!viewer.canManage) return json({ error: "Only admins can manage SLB members." }, 403);
  const { userId } = await ctx.params;
  await prisma.slbMember.deleteMany({ where: { userId } });
  return json({ ok: true });
}
