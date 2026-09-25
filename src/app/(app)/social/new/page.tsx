import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Reveal } from "@/components/motion/Reveal";
import { GuidelinesNote } from "@/components/shell/GuidelinesNote";
import { getT } from "@/lib/i18n/server";
import { NewPostForm } from "./NewPostForm";

export default async function NewPostPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/social/new");
  const t = await getT("social");

  return (
    <div className="mx-auto max-w-xl">
      <Reveal>
        <h1 className="font-display text-4xl">{t("sayComething")}</h1>
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <NewPostForm />
        <GuidelinesNote />
      </Reveal>
    </div>
  );
}
