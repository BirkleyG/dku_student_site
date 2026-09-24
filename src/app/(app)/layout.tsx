import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAnyAdmin } from "@/lib/permissions";
import { DEFAULT_STARRED_NAV } from "@/lib/nav";
import { RouteChrome } from "@/components/shell/RouteChrome";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userLabel = session?.user?.name ?? null;
  const currentUser = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { role: true, adminScopes: true, starredNav: true },
      })
    : null;
  const isAdmin = currentUser ? isAnyAdmin(currentUser) : false;
  // Loaded here (rather than in NavBar) so the header renders with the right
  // stars on the first paint — no flash for logged-in users. Guests have no
  // server-known preference, so they get the same defaults and NavBar swaps
  // in their localStorage value on mount.
  const initialStarred = currentUser && currentUser.starredNav.length > 0 ? currentUser.starredNav : DEFAULT_STARRED_NAV;

  return (
    <div className="relative flex min-h-svh flex-col overflow-x-clip bg-white">
      <RouteChrome userLabel={userLabel} isAdmin={isAdmin} initialStarred={initialStarred}>
        {children}
      </RouteChrome>
    </div>
  );
}
