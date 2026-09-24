import Link from "next/link";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasScope } from "@/lib/permissions";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { NewsletterForm } from "./NewsletterForm";
import { fetchLilypadPosts, LILYPAD_URL } from "@/lib/lilypad";
import { ArrowUpRight } from "lucide-react";

export default async function NewsPage() {
  const session = await auth();
  const [posts, user, lilypad] = await Promise.all([
    prisma.newsPost.findMany({
      orderBy: { publishedAt: "desc" },
      include: { author: { select: { firstName: true, lastName: true } } },
    }),
    session?.user?.email ? prisma.user.findUnique({ where: { email: session.user.email } }) : null,
    fetchLilypadPosts(),
  ]);
  const canPublish = user ? hasScope(user, "NEWS") : false;

  return (
    <div>
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Straight from the Lilypad.</h1>
          <p className="mt-2 max-w-lg text-ink/60">
            The latest from The Lilypad, DKU&apos;s student paper. Stories open on the Lilypad site.
          </p>
        </div>
        {canPublish ? <LinkButton href="/news/new">New article</LinkButton> : null}
      </Reveal>


      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl">From The Lilypad</h2>
          <a
            href={LILYPAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex items-center gap-1 text-sm text-ink/55 hover:text-ink"
          >
            Visit the site <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

        {lilypad && lilypad.length > 0 ? (
          <StaggerGroup className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lilypad.map((article) => (
              <StaggerItem key={article.id}>
                <a href={article.link} target="_blank" rel="noopener noreferrer" className="focus-ring group block h-full">
                  <div className="flex h-full flex-col overflow-hidden rounded-lg border border-ink/10 bg-paper transition duration-300 group-hover:-translate-y-0.5 group-hover:border-ink/20">
                    {article.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={article.image} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" />
                    ) : (
                      <div className="grid aspect-[16/9] w-full place-items-center bg-paper-dim">
                        <span className="font-display text-2xl italic text-ink/25">The Lilypad</span>
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      {article.date ? (
                        <p className="text-xs uppercase tracking-wide text-ink/40">{format(new Date(article.date), "MMM d, yyyy")}</p>
                      ) : null}
                      <h3 className="mt-1 font-display text-xl leading-snug">{article.title}</h3>
                      {article.excerpt ? <p className="mt-1.5 line-clamp-3 text-sm text-ink/60">{article.excerpt}</p> : null}
                      <p className="mt-auto inline-flex items-center gap-1 pt-3 text-xs text-ink/45 group-hover:text-ink">
                        Read on The Lilypad <ArrowUpRight className="h-3 w-3" />
                      </p>
                    </div>
                  </div>
                </a>
              </StaggerItem>
            ))}
          </StaggerGroup>
        ) : (
          <a href={LILYPAD_URL} target="_blank" rel="noopener noreferrer" className="focus-ring mt-4 block">
            <Card className="flex items-center justify-between gap-4 transition-transform duration-300 hover:-translate-y-0.5">
              <div>
                <p className="font-medium text-ink">Read The Lilypad</p>
                <p className="mt-0.5 text-sm text-ink/55">We couldn&apos;t load the latest stories right now. Head to the site instead.</p>
              </div>
              <ArrowUpRight className="h-5 w-5 shrink-0 text-ink/40" />
            </Card>
          </a>
        )}
      </section>

      <Reveal delay={0.1}>
        <Card className="mt-10">
          <p className="text-sm font-medium text-ink">Get new issues by email</p>
          <div className="mt-3">
            <NewsletterForm />
          </div>
        </Card>
      </Reveal>

      {posts.length === 0 ? null : (
        <StaggerGroup className="mt-10 space-y-4">
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
      )}
    </div>
  );
}
