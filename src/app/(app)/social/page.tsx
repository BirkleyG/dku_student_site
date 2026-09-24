import { auth } from "@/lib/auth";
import { Reveal } from "@/components/motion/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { BoardFeed } from "./BoardFeed";

export default async function SocialPage() {
  const session = await auth();

  return (
    <div>
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">Only DKU, talking to DKU.</h1>
          <p className="mt-2 max-w-lg text-ink/60">
            A DKU Life-only space to post, ask, and discuss. Be decent, see the{" "}
            <a href="/terms" className="underline decoration-ink/30 underline-offset-2 hover:text-ink">
              community guidelines
            </a>
            .
          </p>
        </div>
        <LinkButton href={session ? "/social/new" : "/login?callbackUrl=/social/new"}>New post</LinkButton>
      </Reveal>

      <Reveal delay={0.1}>
        <BoardFeed />
      </Reveal>
    </div>
  );
}
