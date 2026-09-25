import { Reveal } from "@/components/motion/Reveal";
import { BackHome } from "@/components/shell/BackHome";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Reveal>
        <BackHome className="mb-8" />
        <h1 className="font-display text-4xl">Community guidelines.</h1>
        <p className="mt-3 text-ink/60">
          Short version: this is a place for DKU students. Be someone your classmates would want to run into.
        </p>
      </Reveal>

      <Reveal delay={0.1} className="mt-10 space-y-8 text-ink/80">
        <Section title="Who this is for">
          DKU Life is built for Duke Kunshan students, using a real @dukekunshan.edu.cn or @duke.edu email.
          Don&apos;t share your login, and don&apos;t create accounts that aren&apos;t yours.
        </Section>

        <Section title="What's not okay">
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>Harassment, hate speech, or targeting someone by name</li>
            <li>Explicit, violent, or otherwise not-safe-for-campus content</li>
            <li>Spam, scams, or posting to sell something unrelated to campus life</li>
            <li>Doxxing: sharing anyone&apos;s private info without consent</li>
            <li>Impersonating another student, staff member, or organization</li>
          </ul>
        </Section>

        <Section title="Events, posts, and clubs">
          Anything you post (an event, a chat message, a rec, a club listing) should be something you&apos;d be fine
          putting your name on, because it already has your name on it. Admins can remove content that breaks these
          guidelines, and repeat issues can mean losing access to post.
        </Section>

        <Section title="Reporting a problem">
          There&apos;s no report button yet. For now, reach out to a site admin directly if something needs a look.
        </Section>
      </Reveal>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      <div className="mt-2 leading-relaxed">{children}</div>
    </section>
  );
}
