import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Look people up by name to start a direct message — for logged-in users only. */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in" }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ users: [] });

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!me) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const users = await prisma.user.findMany({
    where: {
      id: { not: me.id },
      OR: [{ firstName: { contains: q, mode: "insensitive" } }, { lastName: { contains: q, mode: "insensitive" } }],
    },
    select: { id: true, firstName: true, lastName: true },
    take: 10,
    orderBy: { firstName: "asc" },
  });

  return NextResponse.json({ users });
}
