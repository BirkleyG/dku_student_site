import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-6 py-16">
      <Reveal>
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-gold-bright">DKU Life</p>
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
    </main>
  );
}
