import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NotificationCategory } from "@prisma/client";
import { NOTIFICATION_CATEGORY_KEYS } from "@/lib/notification-categories";
import { getNotificationPreferences, setNotificationPreference } from "@/lib/notification-preferences";

const categoryKeys = NOTIFICATION_CATEGORY_KEYS as [NotificationCategory, ...NotificationCategory[]];
const bodySchema = z.object({
  category: z.enum(categoryKeys),
  enabled: z.boolean(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to load notification preferences" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const preferences = await getNotificationPreferences(user.id);
  return NextResponse.json({ preferences });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to save notification preferences" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid notification preference" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await setNotificationPreference(user.id, parsed.data.category, parsed.data.enabled);

  const preferences = await getNotificationPreferences(user.id);
  return NextResponse.json({ ok: true, preferences });
}
