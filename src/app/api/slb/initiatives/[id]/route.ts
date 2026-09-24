import { z } from "zod";
import { SlbInitiativeStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSlbViewer, json } from "@/lib/slb";

const patchSchema = z.object({ status: z.nativeEnum(SlbInitiativeStatus) });

async function loadForEdit(id: string) {
  const viewer = await getSlbViewer();
  if (!viewer) return { error: json({ error: "Log in first." }, 401) };
  const initiative = await prisma.slbInitiative.findUnique({ where: { id }, select: { sponsorId: true } });
  if (!initiative) return { error: json({ error: "Not found" }, 404) };
  if (initiative.sponsorId !== viewer.id && !viewer.canManage) return { error: json({ error: "Not allowed" }, 403) };
  return { viewer };
}

// The sponsor (or an SLB admin) updates where the initiative stands.
export async function PATCH(request: Request, ctx: RouteContext<"/api/slb/initiatives/[id]">) {
  const { id } = await ctx.params;
  const check = await loadForEdit(id);
  if (check.error) return check.error;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Unknown status" }, 400);
  await prisma.slbInitiative.update({ where: { id }, data: { status: parsed.data.status } });
  return json({ ok: true });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/slb/initiatives/[id]">) {
  const { id } = await ctx.params;
  const check = await loadForEdit(id);
  if (check.error) return check.error;
  await prisma.slbInitiative.delete({ where: { id } });
  return json({ ok: true });
}
