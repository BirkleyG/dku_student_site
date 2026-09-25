import { getLilypadCategories, getLilypadPosts } from "@/lib/lilypad";
import { Reveal } from "@/components/motion/Reveal";
import { LilypadFeed } from "./LilypadFeed";
import { getT } from "@/lib/i18n/server";

export default async function NewsPage() {
  const [categories, lilypad, t] = await Promise.all([
    getLilypadCategories(),
    getLilypadPosts({ page: 1, perPage: 9 }),
    getT("news"),
  ]);

  return (
    <div>
      <Reveal>
        <h1 className="font-display text-4xl">{t("pageTitle")}</h1>
        <p className="mt-2 max-w-lg text-ink/60">{t("pageSubtitle")}</p>
      </Reveal>

      <Reveal delay={0.1} className="mt-10">
        <LilypadFeed initialPosts={lilypad.posts} initialTotalPages={lilypad.totalPages} categories={categories} />
      </Reveal>
    </div>
  );
}
