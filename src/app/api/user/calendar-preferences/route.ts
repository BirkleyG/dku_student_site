import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { EventCategory } from "@prisma/client";
import { EVENT_CATEGORIES } from "@/lib/event-categories";

const categoryKeys = EVENT_CATEGORIES.map((c) => c.key) as [EventCategory, ...EventCategory[]];
const bodySchema = z.object({
  hiddenCategories: z.array(z.enum(categoryKeys)),
});

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to save calendar preferences" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid category list" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.user.update({
    where: { id: user.id },
    data: { hiddenEventCategories: parsed.data.hiddenCategories },
  });

  return NextResponse.json({ ok: true });
}
