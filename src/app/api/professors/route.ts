import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { professorSchema } from "@/lib/professor-validation";
import { awardPoints } from "@/lib/community-score";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();

  const professors = await prisma.professor.findMany({
    where: q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { department: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { lastName: "asc" },
    include: { reviews: { select: { gradingRating: true, difficultyRating: true, teachingRating: true } } },
  });

  return NextResponse.json({ professors });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to add a professor" }, { status: 401 });
  }
  if (!session.user.verified) {
    return NextResponse.json({ error: "Verify your DKU email before adding a professor" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = professorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { firstName, lastName, department, email } = parsed.data;
  const professor = await prisma.professor.create({
    data: { firstName, lastName, department, email: email || null, addedById: user.id },
  });
  await awardPoints(user.id, "PROFESSOR_ADDED");

  return NextResponse.json({ professor }, { status: 201 });
}
