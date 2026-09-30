import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session-user";
import { getFriendActivity } from "@/lib/friends";

/** What the people I follow have been doing lately. `since` (ISO) in the response marks what I've already seen. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Log in to see updates" }, { status: 401 });
  const items = await getFriendActivity(user.id);
  return NextResponse.json({ items, seenAt: user.friendsSeenAt?.toISOString() ?? null });
}
