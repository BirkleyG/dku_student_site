import { prisma } from "@/lib/prisma";
import { EatsHttpError, eatsGet } from "@/lib/eats-live";
import { isEatsLinked } from "@/lib/eats-sso";

// "Message the shop" from DKU Eats. One EATS_VENDOR channel per (shop,
// customer); its members are the customer plus every manager of the shop who
// has a DKU Life account, so the whole shop team sees and answers it.
// Membership is re-synced each time the conversation is opened, so new
// managers join and removed ones drop out.

export type EatsShop = { id: string; slug: string; name: string; kind: string; emoji: string; contactWechat: string };

export type OpenShopChatResult =
  | { ok: true; channelId: string }
  /** The viewer manages this shop and didn't name a customer: send them to their inbox. */
  | { ok: false; reason: "own-shop"; shop: EatsShop }
  /** Nobody on the shop's team has a DKU Life account yet. */
  | { ok: false; reason: "no-managers"; shop: EatsShop }
  /** A manager tried to message a customer who isn't on DKU Life. */
  | { ok: false; reason: "customer-not-found"; shop: EatsShop }
  | { ok: false; reason: "not-manager"; shop: EatsShop }
  | { ok: false; reason: "shop-not-found" | "unavailable" };

async function loadShop(slug: string): Promise<{ shop: EatsShop; managers: string[] } | "not-found" | "unavailable"> {
  if (!isEatsLinked()) return "unavailable";
  try {
    const data = await eatsGet<{ vendor: EatsShop; managers: string[] }>(
      `/integrations/dku-life/vendors/${encodeURIComponent(slug)}`,
      { server: true },
    );
    return { shop: data.vendor, managers: data.managers.map((m) => m.toLowerCase()) };
  } catch (err) {
    if (err instanceof EatsHttpError && err.status === 404) return "not-found";
    console.error("DKU Eats shop lookup failed:", err);
    return "unavailable";
  }
}

export async function openShopChat(params: {
  viewer: { id: string; netId: string | null };
  slug: string;
  /** Set when a shop manager messages one of their customers from the order board. */
  customerNetId?: string | null;
}): Promise<OpenShopChatResult> {
  const loaded = await loadShop(params.slug);
  if (loaded === "unavailable") return { ok: false, reason: "unavailable" };
  if (loaded === "not-found") return { ok: false, reason: "shop-not-found" };
  const { shop, managers } = loaded;

  const managerUsers = managers.length
    ? await prisma.user.findMany({
        where: { OR: managers.map((netId) => ({ netId: { equals: netId, mode: "insensitive" as const } })) },
        select: { id: true },
      })
    : [];
  const managerIds = new Set(managerUsers.map((u) => u.id));
  const viewerIsManager = managerIds.has(params.viewer.id);

  let customerId = params.viewer.id;
  if (params.customerNetId) {
    if (!viewerIsManager) return { ok: false, reason: "not-manager", shop };
    const customer = await prisma.user.findFirst({
      where: { netId: { equals: params.customerNetId, mode: "insensitive" } },
      select: { id: true },
    });
    if (!customer) return { ok: false, reason: "customer-not-found", shop };
    customerId = customer.id;
  } else if (viewerIsManager) {
    return { ok: false, reason: "own-shop", shop };
  }

  const team = [...managerIds].filter((id) => id !== customerId);
  if (team.length === 0) return { ok: false, reason: "no-managers", shop };

  const channel = await prisma.chatChannel.upsert({
    where: { eatsVendorId_eatsCustomerId: { eatsVendorId: shop.id, eatsCustomerId: customerId } },
    update: { name: shop.name, eatsVendorSlug: shop.slug },
    create: {
      kind: "EATS_VENDOR",
      name: shop.name,
      description: "DKU Eats",
      eatsVendorId: shop.id,
      eatsVendorSlug: shop.slug,
      eatsCustomerId: customerId,
    },
  });

  const wanted = [customerId, ...team];
  await prisma.$transaction([
    prisma.chatChannelMember.deleteMany({ where: { channelId: channel.id, userId: { notIn: wanted } } }),
    prisma.chatChannelMember.createMany({
      data: wanted.map((userId) => ({ channelId: channel.id, userId })),
      skipDuplicates: true,
    }),
  ]);

  return { ok: true, channelId: channel.id };
}
