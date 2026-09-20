import { NextResponse } from "next/server";
import { z } from "zod";
import { Role, AdminScope } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  role: z.nativeEnum(Role).optional(),
  adminScopes: z.array(z.nativeEnum(AdminScope)).optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const requester = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!requester || requester.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can manage permissions" }, { status: 403 });
  }

  const { id } = await params;
  if (id === requester.id) {
    return NextResponse.json({ error: "You can't change your own permissions" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: parsed.data,
    select: { id: true, role: true, adminScopes: true },
  });

  return NextResponse.json({ user });
}
