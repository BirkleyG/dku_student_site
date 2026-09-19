import { auth } from "@/lib/auth";
import { NavBar } from "@/components/shell/NavBar";
import { PageTransition } from "@/components/motion/PageTransition";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userLabel = session?.user?.name ?? null;

  return (
    <div className="flex min-h-svh flex-col">
      <NavBar userLabel={userLabel} />
      <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <PageTransition>{children}</PageTransition>
      </div>
    </div>
  );
}
