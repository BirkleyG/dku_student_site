import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Reveal } from "@/components/motion/Reveal";
import { GuidelinesNote } from "@/components/shell/GuidelinesNote";
import { NewPostForm } from "./NewPostForm";

export default async function NewPostPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (!session.user.verified) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="font-display text-3xl">Verify your email first</h1>
        <p className="mt-3 text-ink/60">
          Posting to the board requires a verified DKU account. Check your inbox for the verification link we sent
          when you signed up.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.3em] text-gold-bright">New post</p>
        <h1 className="mt-2 font-display text-4xl">Say something.</h1>
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <NewPostForm />
        <GuidelinesNote />
      </Reveal>
    </div>
  );
}
