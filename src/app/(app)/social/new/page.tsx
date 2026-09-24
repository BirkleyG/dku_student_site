import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Reveal } from "@/components/motion/Reveal";
import { GuidelinesNote } from "@/components/shell/GuidelinesNote";
import { NewPostForm } from "./NewPostForm";

export default async function NewPostPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/social/new");

  return (
    <div className="mx-auto max-w-xl">
      <Reveal>
        <h1 className="font-display text-4xl">Say something.</h1>
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <NewPostForm />
        <GuidelinesNote />
      </Reveal>
    </div>
  );
}
