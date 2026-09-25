import Link from "next/link";
import { Suspense } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { BackHome } from "@/components/shell/BackHome";
import { getT } from "@/lib/i18n/server";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const t = await getT("auth");
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-6 py-16">
      <Reveal>
        <BackHome className="mb-6" />
        <h1 className="font-display text-4xl">{t("welcomeBack")}</h1>
      </Reveal>

      <Reveal delay={0.1} className="mt-10">
        <Suspense>
          <LoginForm />
        </Suspense>
      </Reveal>

      <Reveal delay={0.2} className="mt-8 text-center text-sm text-ink/50">
        {t("newHere")}{" "}
        <Link href="/signup" className="text-gold hover:text-gold-bright">
          {t("createAccount")}
        </Link>
      </Reveal>
    </main>
  );
}
