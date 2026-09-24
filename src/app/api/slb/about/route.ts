import { prisma } from "@/lib/prisma";
import { aboutSchema, canPublish, getSlbViewer, json } from "@/lib/slb";

export async function PUT(request: Request) {
  const viewer = await getSlbViewer();
  if (!viewer) return json({ error: "Log in first." }, 401);
  if (!canPublish(viewer)) return json({ error: "Only SLB members can edit this page." }, 403);
  const parsed = aboutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Write at least a sentence." }, 400);
  await prisma.slbAbout.upsert({
    where: { id: "about" },
    create: { id: "about", body: parsed.data.body, updatedById: viewer.id },
    update: { body: parsed.data.body, updatedById: viewer.id },
  });
  return json({ ok: true });
}
