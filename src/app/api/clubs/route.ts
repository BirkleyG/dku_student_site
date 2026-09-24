import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clubSchema, clubCategories } from "@/lib/club-validation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const validCategory =
    category && (clubCategories as readonly string[]).includes(category)
      ? (category as (typeof clubCategories)[number])
      : undefined;

  const clubs = await prisma.club.findMany({
    where: { approved: true, ...(validCategory ? { category: validCategory } : {}) },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ clubs });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Log in to submit a club" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = clubSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, category, description, contact, logoUrl } = parsed.data;
  const club = await prisma.club.create({
    data: {
      name,
      category,
      description,
      contact: contact || null,
      logoUrl: logoUrl || null,
      submittedById: user.id,
    },
  });

  return NextResponse.json({ club }, { status: 201 });
}
