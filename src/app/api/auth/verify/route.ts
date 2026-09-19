import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?verified=0", url));
  }

  const record = await prisma.verificationToken.findUnique({ where: { token } });

  if (!record || record.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/login?verified=expired", url));
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where: { token } }),
  ]);

  return NextResponse.redirect(new URL("/login?verified=1", url));
}
