import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { BackHome } from "@/components/shell/BackHome";
import { getT } from "@/lib/i18n/server";
import { SignupForm } from "./SignupForm";

export default async function SignupPage() {
  const t = await getT("auth");
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-6 py-16">
      <Reveal>
        <BackHome className="mb-6" />
        <h1 className="font-display text-4xl">{t("joinCampus")}</h1>
        <p className="mt-3 text-ink/60">{t("joinCampusSub")}</p>
      </Reveal>

      <Reveal delay={0.1} className="mt-10">
        <SignupForm />
      </Reveal>

      <Reveal delay={0.2} className="mt-8 text-center text-sm text-ink/50">
        {t("alreadyHaveAccount")}{" "}
        <Link href="/login" className="text-gold hover:text-gold-bright">
          {t("logIn")}
        </Link>
      </Reveal>

      <Reveal delay={0.25} className="mt-3 text-center text-xs text-ink/35">
        {t("agreeToTerms")}{" "}
        <Link href="/terms" className="underline decoration-ink/30 underline-offset-2 hover:text-ink">
          {t("communityGuidelines")}
        </Link>
        .
      </Reveal>
    </main>
  );
}
