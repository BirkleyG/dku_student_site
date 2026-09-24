import { auth } from "@/lib/auth";
import { EatsEmbed, GuestNote, OpenInNewTab } from "./EatsEmbed";

export default async function EatsPage() {
  const session = await auth();

  return (
    <div className="relative w-full">
      <EatsEmbed loggedIn={Boolean(session?.user)} />
      <OpenInNewTab />
      {!session && <GuestNote />}
    </div>
  );
}
