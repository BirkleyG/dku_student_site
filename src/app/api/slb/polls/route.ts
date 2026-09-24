import { prisma } from "@/lib/prisma";
import { canPublish, getSlbViewer, json, pollSchema } from "@/lib/slb";

export async function POST(request: Request) {
  const viewer = await getSlbViewer();
  if (!viewer) return json({ error: "Log in first." }, 401);
  if (!canPublish(viewer)) return json({ error: "Only SLB members can run polls." }, 403);
  const parsed = pollSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, 400);
  const { question, options, closesAt } = parsed.data;
  if (closesAt && closesAt <= new Date()) return json({ error: "The closing time has to be in the future." }, 400);
  const poll = await prisma.slbPoll.create({
    data: {
      question,
      closesAt: closesAt ?? null,
      authorId: viewer.id,
      options: { create: options.map((label, position) => ({ label, position })) },
    },
  });
  return json({ id: poll.id }, 201);
}
