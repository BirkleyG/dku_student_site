import { notFound } from "next/navigation";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";
import { Reveal } from "@/components/motion/Reveal";
import { DeleteButton } from "@/components/shell/DeleteButton";
import { CommentThread } from "./CommentThread";

export default async function BoardPostPage({ params }: PageProps<"/social/[id]">) {
  const { id } = await params;
  const [session, post] = await Promise.all([
    auth(),
    prisma.boardPost.findUnique({
      where: { id },
      include: {
        author: { select: { firstName: true, lastName: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { firstName: true, lastName: true } } },
        },
      },
    }),
  ]);

  if (!post) notFound();

  const currentUser = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, adminScopes: true },
      })
    : null;
  const canDelete = currentUser && (currentUser.id === post.authorId || hasScope(currentUser, "BOARD"));

  return (
    <div className="mx-auto max-w-2xl">
      <Reveal className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold-bright">
            {post.author.firstName} {post.author.lastName} · {format(post.createdAt, "MMM d, h:mm a")}
          </p>
          <h1 className="mt-2 font-display text-4xl">{post.title}</h1>
        </div>
        {canDelete ? <DeleteButton endpoint={`/api/board/${post.id}`} redirectTo="/social" /> : null}
      </Reveal>

      <Reveal delay={0.1} className="mt-6 whitespace-pre-wrap leading-relaxed text-ink/80">
        {post.body}
      </Reveal>

      <Reveal delay={0.15}>
        <CommentThread
          postId={post.id}
          initialComments={post.comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }))}
          canComment={Boolean(session?.user)}
        />
      </Reveal>
    </div>
  );
}
