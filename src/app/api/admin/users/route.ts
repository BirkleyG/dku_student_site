import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const requester = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!requester || requester.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can manage permissions" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      netId: true,
      role: true,
      adminScopes: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ users });
}
