import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAnyAdmin } from "@/lib/permissions";
import { MAX_STARRED_NAV, isValidNavHref } from "@/lib/nav";

const bodySchema = z.object({
  starredNav: z.array(z.string()),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to load nav preferences" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { starredNav: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ starredNav: user.starredNav });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to save nav preferences" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid tab list" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, adminScopes: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = isAnyAdmin(user);
  const starredNav = [...new Set(parsed.data.starredNav)].filter((href) => isValidNavHref(href, isAdmin));

  if (starredNav.length > MAX_STARRED_NAV) {
    return NextResponse.json({ error: `You can star at most ${MAX_STARRED_NAV} tabs` }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { starredNav },
  });

  return NextResponse.json({ ok: true, starredNav });
}
