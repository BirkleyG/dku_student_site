import { Reveal } from "@/components/motion/Reveal";
import { BackHome } from "@/components/shell/BackHome";
import { getT } from "@/lib/i18n/server";

export default async function TermsPage() {
  const t = await getT("auth");
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Reveal>
        <BackHome className="mb-8" />
        <h1 className="font-display text-4xl">{t("termsTitle")}</h1>
        <p className="mt-3 text-ink/60">{t("termsIntro")}</p>
      </Reveal>

      <Reveal delay={0.1} className="mt-10 space-y-8 text-ink/80">
        <Section title={t("termsWhoTitle")}>{t("termsWhoBody")}</Section>

        <Section title={t("termsNotOkayTitle")}>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>{t("termsNotOkay1")}</li>
            <li>{t("termsNotOkay2")}</li>
            <li>{t("termsNotOkay3")}</li>
            <li>{t("termsNotOkay4")}</li>
            <li>{t("termsNotOkay5")}</li>
          </ul>
        </Section>

        <Section title={t("termsPostingTitle")}>{t("termsPostingBody")}</Section>

        <Section title={t("termsReportTitle")}>{t("termsReportBody")}</Section>
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
