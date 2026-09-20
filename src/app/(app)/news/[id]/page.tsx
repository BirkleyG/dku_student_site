import { notFound } from "next/navigation";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/motion/Reveal";
import { DeleteButton } from "@/components/shell/DeleteButton";

export default async function NewsArticlePage({ params }: PageProps<"/news/[id]">) {
  const { id } = await params;
  const [session, post] = await Promise.all([
    auth(),
    prisma.newsPost.findUnique({
      where: { id },
      include: { author: { select: { firstName: true, lastName: true } } },
    }),
  ]);

  if (!post) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Reveal className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold-bright">
            {format(post.publishedAt, "MMMM d, yyyy")} · {post.author.firstName} {post.author.lastName}
          </p>
          <h1 className="mt-2 font-display text-4xl">{post.title}</h1>
          <p className="mt-3 text-lg italic text-ink/60">{post.summary}</p>
        </div>
        {session?.user?.role === "ADMIN" ? (
          <DeleteButton endpoint={`/api/news/${post.id}`} redirectTo="/news" />
        ) : null}
      </Reveal>

      <Reveal delay={0.1} className="mt-8 whitespace-pre-wrap leading-relaxed text-ink/80">
        {post.body}
      </Reveal>
    </div>
  );
}
