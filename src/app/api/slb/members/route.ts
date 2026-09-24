import { prisma } from "@/lib/prisma";
import { getSlbViewer, json, memberSchema } from "@/lib/slb";

export async function POST(request: Request) {
  const viewer = await getSlbViewer();
  if (!viewer) return json({ error: "Log in first." }, 401);
  if (!viewer.canManage) return json({ error: "Only admins can manage SLB members." }, 403);
  const parsed = memberSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, 400);

  const key = parsed.data.netIdOrEmail.toLowerCase();
  const user = await prisma.user.findFirst({
    where: key.includes("@") ? { email: key } : { netId: { equals: key, mode: "insensitive" } },
    select: { id: true },
  });
  if (!user) return json({ error: "No DKU Life account with that netID or email." }, 404);

  await prisma.slbMember.upsert({
    where: { userId: user.id },
    create: { userId: user.id, title: parsed.data.title },
    update: { title: parsed.data.title },
  });
  return json({ ok: true }, 201);
}
