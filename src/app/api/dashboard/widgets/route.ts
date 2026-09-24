import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WidgetKind, type Prisma } from "@prisma/client";

const bodySchema = z.object({
  widgets: z
    .array(
      z.object({
        id: z.string(),
        kind: z.nativeEnum(WidgetKind),
        config: z.record(z.string(), z.unknown()).optional(),
      }),
    )
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

  // Update-in-place by id (not delete-all-recreate-all) so a row's createdAt
  // survives unrelated edits — BOARD_TRACKED_POST's "unread since" baseline
  // depends on it staying put when the user just reorders or removes some
  // other widget.
  const existing = await prisma.dashboardWidget.findMany({ where: { userId: user.id }, select: { id: true } });
  const existingIds = new Set(existing.map((w) => w.id));
  const payloadIds = new Set(parsed.data.widgets.map((w) => w.id));
  const toDelete = [...existingIds].filter((id) => !payloadIds.has(id));

  await prisma.$transaction([
    ...(toDelete.length ? [prisma.dashboardWidget.deleteMany({ where: { id: { in: toDelete } } })] : []),
    ...parsed.data.widgets.map((w, position) => {
      const config = (w.config ?? {}) as Prisma.InputJsonValue;
      return existingIds.has(w.id)
        ? prisma.dashboardWidget.update({ where: { id: w.id }, data: { kind: w.kind, config, position } })
        : prisma.dashboardWidget.create({ data: { userId: user.id, kind: w.kind, config, position } });
    }),
  ]);

  return NextResponse.json({ ok: true });
}
