import { prisma } from "@/lib/prisma";
import { announcementSchema, canPublish, getSlbViewer, json } from "@/lib/slb";

export async function POST(request: Request) {
  const viewer = await getSlbViewer();
  if (!viewer) return json({ error: "Log in first." }, 401);
  if (!canPublish(viewer)) return json({ error: "Only SLB members can post announcements." }, 403);
  const parsed = announcementSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, 400);
  const announcement = await prisma.slbAnnouncement.create({ data: { ...parsed.data, authorId: viewer.id } });
  return json({ id: announcement.id }, 201);
}
