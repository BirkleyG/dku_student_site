import { getLilypadCategories, getLilypadPosts } from "@/lib/lilypad";
import { Reveal } from "@/components/motion/Reveal";
import { LilypadFeed } from "./LilypadFeed";

export default async function NewsPage() {
  const [categories, lilypad] = await Promise.all([getLilypadCategories(), getLilypadPosts({ page: 1, perPage: 9 })]);

  return (
    <div>
      <Reveal>
        <h1 className="font-display text-4xl">Straight from the Lilypad.</h1>
        <p className="mt-2 max-w-lg text-ink/60">
          The latest from DKU&apos;s independent student publication — synced live, opens on The Lilypad.
        </p>
      </Reveal>

      <Reveal delay={0.1} className="mt-10">
        <LilypadFeed initialPosts={lilypad.posts} initialTotalPages={lilypad.totalPages} categories={categories} />
      </Reveal>
    </div>
  );
}
