import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WidgetType, WidgetSize } from "@prisma/client";

const bodySchema = z.object({
  widgets: z
    .array(z.object({ type: z.nativeEnum(WidgetType), size: z.nativeEnum(WidgetSize) }))
    .max(24),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to customize your dashboard" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid widget list" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.dashboardWidget.deleteMany({ where: { userId: user.id } }),
    prisma.dashboardWidget.createMany({
      data: parsed.data.widgets.map(({ type, size }, position) => ({
        userId: user.id,
        type,
        size,
        position,
      })),
    }),
  ]);

  return NextResponse.json({ ok: true });
}
