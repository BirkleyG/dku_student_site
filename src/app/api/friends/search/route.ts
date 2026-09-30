import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session-user";
import { searchPeople } from "@/lib/friends";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Log in to find people" }, { status: 401 });
  const q = new URL(request.url).searchParams.get("q") ?? "";
  return NextResponse.json({ people: await searchPeople(user.id, q) });
}
