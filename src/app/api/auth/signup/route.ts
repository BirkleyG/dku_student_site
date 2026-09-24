import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { signupSchema, emailMatchesNetId, normalizeNetId } from "@/lib/validation";
import { getClientIp, isRateLimited, recordFailure } from "@/lib/rate-limit";
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

  const { firstName, lastName, netId, email, password, inviteCode } = parsed.data;

  // The invite code is issued per-netID, so the email has to line up with
  // that netID too — otherwise someone could claim a code meant for netID
  // `abc12` while signing up with a different person's email address.
  if (!emailMatchesNetId(email, netId)) {
    return NextResponse.json(
      { error: "Your email doesn't match your netID.", field: "email" },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  // Rate-limit the invite-code step specifically: someone hammering wrong
  // codes against this endpoint is trying to brute-force one, not just
  // mistyping their own. See src/lib/rate-limit.ts for the (in-memory,
  // resets-on-redeploy) implementation.
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { error: "Too many invite code attempts. Please wait a while and try again.", field: "inviteCode" },
      { status: 429 },
    );
  }

  // Bootstrap problem: invite codes can only be issued by an ADMIN, and
  // there is no ADMIN until someone signs up. Rather than letting whoever
  // signs up first in on an empty database, only allow the no-code
  // bootstrap path for the netID named in BOOTSTRAP_ADMIN_NETID (see
  // README / .env.example). Anyone else always needs a real invite code,
  // even against an empty database.
  const bootstrapNetId = process.env.BOOTSTRAP_ADMIN_NETID;
  const isBootstrapAdmin =
    !!bootstrapNetId &&
    normalizeNetId(bootstrapNetId) === normalizeNetId(netId) &&
    (await prisma.user.count()) === 0;

  const invite = isBootstrapAdmin
    ? null
    : await prisma.inviteCode.findFirst({
        where: { code: inviteCode, netId: { equals: netId, mode: "insensitive" }, usedAt: null },
      });
  if (!isBootstrapAdmin && !invite) {
    recordFailure(clientIp);
    return NextResponse.json(
      { error: "That invite code doesn't match your netID, or has already been used.", field: "inviteCode" },
      { status: 403 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  let user;
  try {
    user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          firstName,
          lastName,
          netId,
          email,
          passwordHash,
          role: isBootstrapAdmin ? "ADMIN" : "STUDENT",
        },
      });
      if (invite) {
        // Re-check usedAt inside the transaction so two concurrent signups
        // racing on the same code can't both succeed.
        const claimed = await tx.inviteCode.updateMany({
          where: { id: invite.id, usedAt: null },
          data: { usedAt: new Date(), usedById: created.id },
        });
        if (claimed.count === 0) {
          throw new Error("INVITE_ALREADY_USED");
        }
      }
      return created;
    });
  } catch (err) {
    if (err instanceof Error && err.message === "INVITE_ALREADY_USED") {
      return NextResponse.json(
        { error: "That invite code was just used by someone else.", field: "inviteCode" },
        { status: 409 },
      );
    }
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
