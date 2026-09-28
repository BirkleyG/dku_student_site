import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dearDkuPostSchema, dearDkuCategories } from "@/lib/dear-dku-validation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const validCategory =
    category && (dearDkuCategories as readonly string[]).includes(category)
      ? (category as (typeof dearDkuCategories)[number])
      : undefined;

  const posts = await prisma.dearDkuPost.findMany({
    where: validCategory ? { category: validCategory } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { firstName: true, lastName: true } },
      _count: { select: { comments: true } },
    },
  });

  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to publish" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = dearDkuPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title, summary, category, submissionType, docUrl, fileUrl } = parsed.data;
  const post = await prisma.dearDkuPost.create({
    data: {
      title,
      summary,
      category,
      submissionType,
      docUrl: submissionType === "GOOGLE_DOC" ? docUrl || null : null,
      fileUrl: submissionType === "FILE" ? fileUrl || null : null,
      authorId: user.id,
    },
  });

  return NextResponse.json({ post }, { status: 201 });
}
