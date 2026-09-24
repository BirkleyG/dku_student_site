import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { wisdomPostSchema, wisdomCategories } from "@/lib/wisdom-validation";
import { awardPoints } from "@/lib/community-score";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const validCategory =
    category && (wisdomCategories as readonly string[]).includes(category)
      ? (category as (typeof wisdomCategories)[number])
      : undefined;

  const posts = await prisma.wisdomPost.findMany({
    where: validCategory ? { category: validCategory } : undefined,
    orderBy: { createdAt: "desc" },
    include: { author: { select: { firstName: true, lastName: true } }, votes: true },
  });

  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to post" }, { status: 401 });
  }
  if (!session.user.verified) {
    return NextResponse.json({ error: "Verify your DKU email before posting" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = wisdomPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title, category, location, body: text } = parsed.data;
  const post = await prisma.wisdomPost.create({
    data: { title, category, location: location || null, body: text, authorId: user.id },
  });
  await awardPoints(user.id, "WISDOM_POST");

  return NextResponse.json({ post }, { status: 201 });
}
