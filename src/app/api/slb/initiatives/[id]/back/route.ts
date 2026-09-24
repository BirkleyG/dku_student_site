import { prisma } from "@/lib/prisma";
import { getSlbViewer, json } from "@/lib/slb";

// SLB members co-sponsor ("back") an initiative. POST backs it, DELETE withdraws.
async function guard(id: string) {
  const viewer = await getSlbViewer();
  if (!viewer) return { error: json({ error: "Log in first." }, 401) };
  if (!viewer.isMember) return { error: json({ error: "Only SLB members can back initiatives." }, 403) };
  const initiative = await prisma.slbInitiative.findUnique({ where: { id }, select: { sponsorId: true } });
  if (!initiative) return { error: json({ error: "Not found" }, 404) };
  if (initiative.sponsorId === viewer.id) return { error: json({ error: "You're already the sponsor." }, 400) };
  return { viewer };
}

export async function POST(_request: Request, ctx: RouteContext<"/api/slb/initiatives/[id]/back">) {
  const { id } = await ctx.params;
  const check = await guard(id);
  if (check.error) return check.error;
  await prisma.slbInitiativeBacker.upsert({
    where: { initiativeId_userId: { initiativeId: id, userId: check.viewer.id } },
    create: { initiativeId: id, userId: check.viewer.id },
    update: {},
  });
  return json({ ok: true });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/slb/initiatives/[id]/back">) {
  const { id } = await ctx.params;
  const check = await guard(id);
  if (check.error) return check.error;
  await prisma.slbInitiativeBacker.deleteMany({ where: { initiativeId: id, userId: check.viewer.id } });
  return json({ ok: true });
}
