import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { wisdomTopicSchema, wisdomCategories } from "@/lib/wisdom-validation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const validCategory =
    category && (wisdomCategories as readonly string[]).includes(category)
      ? (category as (typeof wisdomCategories)[number])
      : undefined;

  const topics = await prisma.wisdomTopic.findMany({
    where: validCategory ? { category: validCategory } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      _count: { select: { recommendations: true } },
    },
  });

  return NextResponse.json({ topics });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to start a topic" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = wisdomTopicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title, category, description, requireLocation } = parsed.data;
  const topic = await prisma.wisdomTopic.create({
    data: { title, category, description: description || null, requireLocation, createdById: user.id },
  });

  return NextResponse.json({ topic }, { status: 201 });
}
