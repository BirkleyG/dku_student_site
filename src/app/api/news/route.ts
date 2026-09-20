import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { newsPostSchema } from "@/lib/news-validation";

export async function GET() {
  const posts = await prisma.newsPost.findMany({
    orderBy: { publishedAt: "desc" },
    include: { author: { select: { firstName: true, lastName: true } } },
  });
  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can publish news right now" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = newsPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const post = await prisma.newsPost.create({
    data: { ...parsed.data, authorId: user.id },
  });

  return NextResponse.json({ post }, { status: 201 });
}
