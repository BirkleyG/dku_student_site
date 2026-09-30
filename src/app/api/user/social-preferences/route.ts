import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session-user";
import { socialPreferencesSchema } from "@/lib/social-validation";

export async function PUT(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Log in first" }, { status: 401 });
  const parsed = socialPreferencesSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  const { birthdayMonth, birthdayDay, showBirthday, shareActivity, showOnlineStatus } = parsed.data;
  await prisma.user.update({
    where: { id: user.id },
    // A birthday can only be shared once it's set.
    data: { birthdayMonth, birthdayDay, showBirthday: showBirthday && birthdayMonth !== null, shareActivity, showOnlineStatus },
  });
  return NextResponse.json({ ok: true });
}
