import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";

type Params = { params: Promise<{ id: string; resourceId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const { resourceId } = await params;
  const [user, resource] = await Promise.all([
    prisma.user.findUnique({ where: { email: session.user.email } }),
    prisma.courseResource.findUnique({ where: { id: resourceId } }),
  ]);

  if (!user || !resource) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (resource.authorId !== user.id && !hasScope(user, "COURSES")) {
    return NextResponse.json({ error: "You can't remove this resource" }, { status: 403 });
  }

  await prisma.courseResource.delete({ where: { id: resourceId } });
  return NextResponse.json({ ok: true });
}
