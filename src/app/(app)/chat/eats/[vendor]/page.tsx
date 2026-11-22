import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { openShopChat } from "@/lib/eats-chat";

/**
 * Deep link from DKU Eats' "Message <shop> on DKU Life" button:
 *   /chat/eats/<shop slug>                     customer -> the shop's team
 *   /chat/eats/<shop slug>?customer=<netid>    shop manager -> one customer (order board)
 * Opens (or creates) the shop conversation in Messages, or explains why it can't.
 */
export default async function ShopChatDeepLink({ params, searchParams }: PageProps<"/chat/eats/[vendor]">) {
  const { vendor } = await params;
  const { customer } = await searchParams;
  const customerNetId = typeof customer === "string" && customer ? customer : null;

  const session = await auth();
  if (!session?.user?.email) {
    const back = `/chat/eats/${encodeURIComponent(vendor)}${customerNetId ? `?customer=${encodeURIComponent(customerNetId)}` : ""}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(back)}`);
  }

  const me = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, netId: true } });
  if (!me) redirect("/login");

  const result = await openShopChat({ viewer: me, slug: vendor, customerNetId });
  if (result.ok) redirect(`/chat?channel=${result.channelId}#messages`);

  const t = await getT("chat");
  const shop = "shop" in result ? result.shop : null;
  const message = {
    "no-managers": t("shopChatNoManagers", { shop: shop?.name ?? "" }),
    "own-shop": t("shopChatOwn"),
    "customer-not-found": t("shopChatCustomerMissing"),
    "not-manager": t("shopChatNotManager"),
    "shop-not-found": t("shopChatNotFound"),
    unavailable: t("shopChatUnavailable"),
  }[result.reason];

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-12 pt-16 sm:px-6">
      <h1 className="font-display text-3xl">{t("shopChatTitle", { shop: shop?.name ?? "DKU Eats" })}</h1>
      <p className="mt-3 text-ink/70">{message}</p>
      {result.reason === "no-managers" && shop?.contactWechat ? (
        <p className="mt-2 text-ink/70">{t("shopChatWechat", { wechat: shop.contactWechat })}</p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        {shop ? (
          <Link href={`/eats?shop=${encodeURIComponent(shop.slug)}`} className="focus-ring rounded-sm bg-ink px-4 py-2 text-sm text-paper">
            {t("shopChatBackToShop")}
          </Link>
        ) : null}
        <Link href="/chat#messages" className="focus-ring rounded-sm border border-ink/20 px-4 py-2 text-sm text-ink/70 hover:text-ink">
          {t("shopChatToMessages")}
        </Link>
      </div>
    </div>
  );
}
