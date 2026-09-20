import Link from "next/link";
import { Suspense } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-6 py-16">
      <Reveal>
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-gold-bright">DKU Life</p>
        <h1 className="font-display text-4xl">Welcome back.</h1>
      </Reveal>

      <Reveal delay={0.1} className="mt-10">
        <Suspense>
          <LoginForm />
        </Suspense>
      </Reveal>

      <Reveal delay={0.2} className="mt-8 text-center text-sm text-ink/50">
        New here?{" "}
        <Link href="/signup" className="text-gold hover:text-gold-bright">
          Create an account
        </Link>
      </Reveal>
    </main>
  );
}
