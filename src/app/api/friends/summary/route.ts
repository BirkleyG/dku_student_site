import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session-user";
import { countUnseenActivity, getOnlineFriends } from "@/lib/friends";

/** Numbers for the header's Friends button: unseen updates and friends online. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ unseen: 0, online: 0 });
  const [unseen, online] = await Promise.all([countUnseenActivity(user), getOnlineFriends(user.id)]);
  return NextResponse.json({ unseen, online: online.length });
}
