import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAnyAdmin } from "@/lib/permissions";
import { computeSemesterReview, getReviewSemesters } from "@/lib/semester-review";

/**
 * Read-only. Returns the semesters the user can review plus the stats for one
 * (`?key=`, default newest). `?preview=1` is honored for admins only and also
 * exposes semesters still in progress. Never writes anything.
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Log in first" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, adminScopes: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const params = new URL(request.url).searchParams;
  const preview = params.has("preview") && isAnyAdmin(user);
  const semesters = getReviewSemesters(new Date(), preview);
  const key = params.get("key") ?? semesters[0]?.key;
  const review = key ? await computeSemesterReview(user.id, key, new Date(), preview) : null;
  return NextResponse.json({ semesters, review, preview });
}
