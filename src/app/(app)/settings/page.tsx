import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/motion/Reveal";
import { getNotificationPreferences } from "@/lib/notification-preferences";
import { NotificationPreferencesForm } from "@/components/settings/NotificationPreferencesForm";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) redirect("/login");

  const preferences = await getNotificationPreferences(user.id);

  return (
    <div className="mx-auto max-w-2xl">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.3em] text-gold-bright">Settings</p>
        <h1 className="mt-2 font-display text-4xl">Notifications</h1>
        <p className="mt-2 text-sm text-ink/50">
          Choose which kinds of push notifications you want to hear from. Turning a category off stops those
          notifications only — you&apos;ll still see the content in the app.
        </p>
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        <NotificationPreferencesForm initialPreferences={preferences} />
      </Reveal>
    </div>
  );
}
