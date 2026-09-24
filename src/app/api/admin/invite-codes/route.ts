import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInviteCode } from "@/lib/invite-code";
import { normalizeNetId } from "@/lib/validation";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  return user?.role === "ADMIN" ? user : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Only admins can view invite codes" }, { status: 403 });

  const codes = await prisma.inviteCode.findMany({
    orderBy: { createdAt: "desc" },
    include: { usedBy: { select: { firstName: true, lastName: true, email: true } } },
  });

  return NextResponse.json({ codes });
}

const bodySchema = z.object({
  netId: z.string().trim().min(1, "NetID is required").max(40),
});

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Only admins can create invite codes" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  // Normalize the netID the same way the signup route compares it (trimmed,
  // lowercased) so issued codes always line up with what a student submits.
  const netId = normalizeNetId(parsed.data.netId);

  // Extremely unlikely to collide, but the code column is globally unique
  // (not just per-netID), so retry on the off chance it does.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const code = await prisma.inviteCode.create({
        data: { netId, code: generateInviteCode(), createdById: admin.id },
      });
      return NextResponse.json({ code }, { status: 201 });
    } catch (err) {
      const isDup =
        err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "P2002";
      if (!isDup || attempt === 4) throw err;
    }
  }
  throw new Error("unreachable");
}
