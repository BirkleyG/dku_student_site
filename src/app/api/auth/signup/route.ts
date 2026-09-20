import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validation";
import { sendVerificationEmail } from "@/lib/mailer";

const VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24; // 24h

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { firstName, lastName, netId, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  let user;
  try {
    user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        netId: netId || null,
        email,
        passwordHash,
      },
    });
  } catch (err) {
    // A second submit of the same form (e.g. a duplicate Enter/click while
    // the first request was still in flight) can race past the findUnique
    // check above — fall back to the DB's own unique constraint here.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined) ?? [];
      const field = target.includes("net_id") || target.includes("netId") ? "netID" : "email";
      return NextResponse.json({ error: `An account with that ${field} already exists` }, { status: 409 });
    }
    throw err;
  }

  const token = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
    },
  });

  const origin = request.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const verifyUrl = `${origin}/api/auth/verify?token=${token}`;
  await sendVerificationEmail(user.email, verifyUrl);

  return NextResponse.json({ ok: true, userId: user.id });
}
