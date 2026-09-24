import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";
import { Reveal } from "@/components/motion/Reveal";
import { NewArticleForm } from "./NewArticleForm";

export default async function NewArticlePage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || !hasScope(user, "NEWS")) redirect("/news");

  return (
    <div className="mx-auto max-w-2xl">
      <Reveal>
        <h1 className="font-display text-4xl">Publish an update.</h1>
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <NewArticleForm />
      </Reveal>
    </div>
  );
}
