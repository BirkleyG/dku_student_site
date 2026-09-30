import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session-user";
import { getConnections } from "@/lib/friends";

/** Who I follow and who follows me. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Log in to see your friends" }, { status: 401 });
  return NextResponse.json(await getConnections(user.id));
}
