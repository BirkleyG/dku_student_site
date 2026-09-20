import { auth } from "@/lib/auth";
import { Reveal } from "@/components/motion/Reveal";
import { EatsEmbed, OpenInNewTab } from "./EatsEmbed";

export default async function EatsPage() {
  const session = await auth();

  return (
    <div>
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold-bright">DKU Eats</p>
          <h1 className="mt-2 font-display text-4xl">Student-cooked food, on demand.</h1>
          <p className="mt-2 max-w-lg text-ink/60">
            {session
              ? "You're signed in automatically — order away."
              : "Browsing as a guest. Log in to DKU Life to skip DKU Eats' own login."}
          </p>
        </div>
        <OpenInNewTab />
      </Reveal>

      <Reveal delay={0.1}>
        <EatsEmbed loggedIn={Boolean(session?.user)} />
      </Reveal>
    </div>
  );
}
