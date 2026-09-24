import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { BackHome } from "@/components/shell/BackHome";
import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-6 py-16">
      <Reveal>
        <BackHome className="mb-6" />
        <h1 className="font-display text-4xl">Join the campus.</h1>
        <p className="mt-3 text-ink/60">
          One account for events, food, news, and everything else happening at DKU.
        </p>
      </Reveal>

      <Reveal delay={0.1} className="mt-10">
        <SignupForm />
      </Reveal>

      <Reveal delay={0.2} className="mt-8 text-center text-sm text-ink/50">
        Already have an account?{" "}
        <Link href="/login" className="text-gold hover:text-gold-bright">
          Log in
        </Link>
      </Reveal>

      <Reveal delay={0.25} className="mt-3 text-center text-xs text-ink/35">
        By signing up you agree to the{" "}
        <Link href="/terms" className="underline decoration-ink/30 underline-offset-2 hover:text-ink">
          community guidelines
        </Link>
        .
      </Reveal>
    </main>
  );
}
