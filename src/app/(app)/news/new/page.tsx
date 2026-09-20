import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Reveal } from "@/components/motion/Reveal";
import { NewArticleForm } from "./NewArticleForm";

export default async function NewArticlePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/news");

  return (
    <div className="mx-auto max-w-2xl">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.3em] text-gold-bright">New article</p>
        <h1 className="mt-2 font-display text-4xl">Publish an update.</h1>
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <NewArticleForm />
      </Reveal>
    </div>
  );
}
