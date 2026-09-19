import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultWidgetOrder } from "@/lib/widgets";
import { WidgetType } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ widgets: defaultWidgetOrder });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ widgets: defaultWidgetOrder });

  const saved = await prisma.dashboardWidget.findMany({
    where: { userId: user.id },
    orderBy: { position: "asc" },
  });

  return NextResponse.json({
    widgets: saved.length ? saved.map((w) => w.type) : defaultWidgetOrder,
  });
}

const bodySchema = z.object({
  widgets: z.array(z.nativeEnum(WidgetType)).min(1).max(6),
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
      data: parsed.data.widgets.map((type, position) => ({ userId: user.id, type, position })),
    }),
  ]);

  return NextResponse.json({ ok: true });
}
