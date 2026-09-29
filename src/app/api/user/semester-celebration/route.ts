import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { getCelebrationToShow } from "@/lib/academic-calendar";

const bodySchema = z.object({ action: z.enum(["shown", "dismiss"]) });

/**
 * "shown": records the (user, semester) row the first time the popup is
 * displayed and, only on that first insert, sends the push notification
 * (respecting the ACADEMIC category preference inside sendPushToUser).
 * "dismiss": marks the popup dismissed so it never shows again this semester.
 * The semester is always derived server-side from the calendar.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Log in first" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const semester = getCelebrationToShow();
  if (!semester) return NextResponse.json({ ok: true, active: false });

  if (parsed.data.action === "dismiss") {
    await prisma.semesterCelebration.upsert({
      where: { userId_semesterKey: { userId: user.id, semesterKey: semester.key } },
      update: { dismissedAt: new Date() },
      create: { userId: user.id, semesterKey: semester.key, dismissedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  const created = await prisma.semesterCelebration.createMany({
    data: [{ userId: user.id, semesterKey: semester.key }],
    skipDuplicates: true,
  });
  if (created.count === 1) {
    // Best-effort: a push failure must never break the popup.
    try {
      await sendPushToUser(user.id, {
        category: "ACADEMIC",
        title: semester.kind === "session" ? `Congrats on finishing ${semester.label}!` : "Congratulations!",
        body:
          semester.kind === "session"
            ? "Take a moment to log your courses and rate your professors while it's fresh."
            : "You made it through another session at DKU! Log your courses and rate your professors.",
        url: "/courses",
      });
    } catch (error) {
      console.error("semester celebration push failed", error);
    }
  }
  return NextResponse.json({ ok: true });
}
