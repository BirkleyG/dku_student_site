import Link from "next/link";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";
import { getLilypadCategories, getLilypadPosts } from "@/lib/lilypad";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { NewsletterForm } from "./NewsletterForm";
import { LilypadFeed } from "./LilypadFeed";

export default async function NewsPage() {
  const session = await auth();
  const [posts, user, categories, lilypad] = await Promise.all([
    prisma.newsPost.findMany({
      orderBy: { publishedAt: "desc" },
      include: { author: { select: { firstName: true, lastName: true } } },
    }),
    session?.user?.email ? prisma.user.findUnique({ where: { email: session.user.email } }) : null,
    getLilypadCategories(),
    getLilypadPosts({ page: 1, perPage: 9 }),
  ]);
  const canPublish = user ? hasScope(user, "NEWS") : false;

  return (
    <div>
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold-bright">DKU News</p>
          <h1 className="mt-2 font-display text-4xl">Straight from the Lilypad.</h1>
          <p className="mt-2 max-w-lg text-ink/60">
            The latest from DKU&apos;s independent student publication — synced live, opens on The Lilypad.
          </p>
        </div>
        {canPublish ? <LinkButton href="/news/new">New article</LinkButton> : null}
      </Reveal>

      <Reveal delay={0.1}>
        <Card className="mt-8">
          <p className="text-sm font-medium text-ink">Get new issues by email</p>
          <div className="mt-3">
            <NewsletterForm />
          </div>
        </Card>
      </Reveal>

      <Reveal delay={0.15} className="mt-10">
        <LilypadFeed initialPosts={lilypad.posts} initialTotalPages={lilypad.totalPages} categories={categories} />
      </Reveal>

      {posts.length > 0 ? (
        <div className="mt-14">
          <p className="text-xs uppercase tracking-[0.3em] text-gold-bright">DKU Announcements</p>
          <StaggerGroup className="mt-4 space-y-4">
            {posts.map((post) => (
              <StaggerItem key={post.id}>
                <Link href={`/news/${post.id}`} className="focus-ring block">
                  <Card className="transition-transform duration-300 hover:-translate-y-0.5">
                    <p className="text-xs uppercase tracking-wide text-ink/40">{format(post.publishedAt, "MMM d, yyyy")}</p>
                    <h3 className="mt-1 font-display text-2xl">{post.title}</h3>
                    <p className="mt-1.5 text-sm text-ink/60">{post.summary}</p>
                  </Card>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      ) : null}
    </div>
  );
}
