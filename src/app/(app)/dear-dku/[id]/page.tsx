import { notFound } from "next/navigation";
import { ExternalLink, FileText } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";
import { dearDkuCategoryLabels } from "@/lib/dear-dku-validation";
import { Reveal } from "@/components/motion/Reveal";
import { Button, LinkButton } from "@/components/ui/Button";
import { DeleteButton } from "@/components/shell/DeleteButton";
import { getT } from "@/lib/i18n/server";
import { FeedbackSection } from "./FeedbackSection";

export default async function DearDkuPostPage({ params }: PageProps<"/dear-dku/[id]">) {
  const { id } = await params;
  const t = await getT("dearDku");
  const [session, post] = await Promise.all([
    auth(),
    prisma.dearDkuPost.findUnique({
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
  const isDearDkuAdmin = currentUser ? hasScope(currentUser, "DEARDKU") : false;
  const canDeletePost = currentUser && (currentUser.id === post.authorId || isDearDkuAdmin);

  return (
    <div className="mx-auto max-w-2xl">
      <Reveal className="flex items-start justify-between gap-4">
        <div>
          <span className="rounded-full bg-sprout/25 px-2.5 py-0.5 text-xs font-medium text-sprout-deep">
            {dearDkuCategoryLabels[post.category]}
          </span>
          <h1 className="mt-2 font-display text-4xl">{post.title}</h1>
          <p className="mt-2 text-sm text-ink/50">
            {t("publishedBy", { name: `${post.author.firstName} ${post.author.lastName}` })}
          </p>
        </div>
        {canDeletePost ? (
          <DeleteButton endpoint={`/api/dear-dku/${post.id}`} redirectTo="/dear-dku" confirmText={t("confirmRemovePost")} />
        ) : null}
      </Reveal>

      <Reveal delay={0.05} className="mt-4 whitespace-pre-wrap leading-relaxed text-ink/80">
        {post.summary}
      </Reveal>

      <Reveal delay={0.1} className="mt-6 rounded-2xl border border-ink/10 bg-paper-dim p-5">
        {post.submissionType === "GOOGLE_DOC" && post.docUrl ? (
          <div>
            <p className="text-sm text-ink/60">{t("readTheFullPiece")}</p>
            <LinkButton href={post.docUrl} className="mt-3">
              {t("openGoogleDoc")}
              <ExternalLink className="h-4 w-4" />
            </LinkButton>
            <p className="mt-3 text-xs text-ink/45">{t("gdocFeedbackHint")}</p>
          </div>
        ) : post.fileUrl ? (
          <div>
            <p className="text-sm text-ink/60">{t("readTheFullPiece")}</p>
            <a href={post.fileUrl} target="_blank" rel="noopener noreferrer">
              <Button className="mt-3">
                <FileText className="h-4 w-4" />
                {t("openFile")}
              </Button>
            </a>
          </div>
        ) : null}
      </Reveal>

      <Reveal delay={0.15}>
        <FeedbackSection
          postId={post.id}
          isGoogleDoc={post.submissionType === "GOOGLE_DOC"}
          currentUserId={currentUser?.id ?? null}
          isAdmin={isDearDkuAdmin}
          canComment={Boolean(session?.user)}
          initialComments={post.comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }))}
        />
      </Reveal>
    </div>
  );
}
