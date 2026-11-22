import { auth } from "@/lib/auth";
import { EatsEmbed, GuestNote, OpenInNewTab } from "./EatsEmbed";

const SLUG_RE = /^[a-z0-9-]{1,80}$/i;

/** `/eats?shop=<slug>` opens that shop inside the embed (used by the calendar and Messages). */
export default async function EatsPage({ searchParams }: PageProps<"/eats">) {
  const session = await auth();
  const { shop } = await searchParams;
  const slug = typeof shop === "string" && SLUG_RE.test(shop) ? shop : null;
  const path = slug ? `/v/${slug}` : "/";

  return (
    <div className="relative w-full">
      <EatsEmbed loggedIn={Boolean(session?.user)} path={path} />
      <OpenInNewTab path={path} />
      {!session && <GuestNote />}
    </div>
  );
}
