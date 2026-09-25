import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ChatApp } from "./ChatApp";

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/chat");

  return (
    <Suspense>
      <ChatApp currentUserName={session.user.name ?? "You"} />
    </Suspense>
  );
}
