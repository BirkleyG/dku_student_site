import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { wisdomRecommendationSchema } from "@/lib/wisdom-validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to add a recommendation" }, { status: 401 });
  }

  const { id: topicId } = await params;
  const topic = await prisma.wisdomTopic.findUnique({ where: { id: topicId } });
  if (!topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = wisdomRecommendationSchema.safeParse({ ...body, requireLocation: topic.requireLocation });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { placeName, location, description } = parsed.data;
  const recommendation = await prisma.wisdomRecommendation.create({
    data: { topicId, placeName, location: location || null, description, authorId: user.id },
    include: { author: { select: { firstName: true, lastName: true } }, votes: true },
  });

  return NextResponse.json({ recommendation }, { status: 201 });
}
