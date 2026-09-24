import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSlbViewer, json } from "@/lib/slb";

const bodySchema = z.object({ optionId: z.string().min(1) });

// One vote per person; voting again switches your choice while the poll is open.
export async function POST(request: Request, ctx: RouteContext<"/api/slb/polls/[id]/vote">) {
  const viewer = await getSlbViewer();
  if (!viewer) return json({ error: "Log in to vote." }, 401);
  const { id } = await ctx.params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Pick an option." }, 400);

  const poll = await prisma.slbPoll.findUnique({ where: { id }, select: { closesAt: true, options: { select: { id: true } } } });
  if (!poll) return json({ error: "Poll not found" }, 404);
  if (poll.closesAt && poll.closesAt <= new Date()) return json({ error: "This poll has closed." }, 409);
  if (!poll.options.some((o) => o.id === parsed.data.optionId)) return json({ error: "That option isn't on this poll." }, 400);

  await prisma.slbPollVote.upsert({
    where: { pollId_userId: { pollId: id, userId: viewer.id } },
    create: { pollId: id, userId: viewer.id, optionId: parsed.data.optionId },
    update: { optionId: parsed.data.optionId },
  });
  return json({ ok: true });
}
