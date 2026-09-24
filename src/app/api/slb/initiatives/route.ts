import { prisma } from "@/lib/prisma";
import { canPublish, getSlbViewer, initiativeSchema, json } from "@/lib/slb";

export async function POST(request: Request) {
  const viewer = await getSlbViewer();
  if (!viewer) return json({ error: "Log in first." }, 401);
  if (!canPublish(viewer)) return json({ error: "Only SLB members can propose initiatives." }, 403);
  const parsed = initiativeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, 400);
  const initiative = await prisma.slbInitiative.create({ data: { ...parsed.data, sponsorId: viewer.id } });
  return json({ id: initiative.id }, 201);
}
