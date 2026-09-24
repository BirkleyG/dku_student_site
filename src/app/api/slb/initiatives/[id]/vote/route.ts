import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSlbViewer, json } from "@/lib/slb";

// Community vote: 1 = yes, -1 = no, 0 = take my vote back.
const bodySchema = z.object({ value: z.union([z.literal(1), z.literal(-1), z.literal(0)]) });

export async function POST(request: Request, ctx: RouteContext<"/api/slb/initiatives/[id]/vote">) {
  const viewer = await getSlbViewer();
  if (!viewer) return json({ error: "Log in to vote." }, 401);
  const { id } = await ctx.params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Invalid vote" }, 400);

  const initiative = await prisma.slbInitiative.findUnique({ where: { id }, select: { status: true } });
  if (!initiative) return json({ error: "Not found" }, 404);
  if (initiative.status === "PASSED" || initiative.status === "NOT_PASSED") {
    return json({ error: "Voting is closed on this initiative." }, 409);
  }

  const where = { initiativeId_userId: { initiativeId: id, userId: viewer.id } };
  if (parsed.data.value === 0) {
    await prisma.slbInitiativeVote.deleteMany({ where: { initiativeId: id, userId: viewer.id } });
  } else {
    await prisma.slbInitiativeVote.upsert({
      where,
      create: { initiativeId: id, userId: viewer.id, value: parsed.data.value },
      update: { value: parsed.data.value },
    });
  }
  return json({ ok: true });
}
