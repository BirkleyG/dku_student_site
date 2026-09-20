import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { newsletterSchema } from "@/lib/news-validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid email" }, { status: 400 });
  }

  try {
    await prisma.newsletterSignup.create({ data: { email: parsed.data.email } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ ok: true }); // already signed up — treat as success
    }
    throw err;
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
