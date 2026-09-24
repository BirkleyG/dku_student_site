import {
  Home,
  CalendarDays,
  UtensilsCrossed,
  MessagesSquare,
  Newspaper,
  Compass,
  Users2,
  ShoppingBag,
  Landmark,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/eats", label: "DKU Eats", icon: UtensilsCrossed },
  { href: "/social", label: "Board", icon: MessagesSquare },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/wisdom", label: "Wisdom", icon: Compass },
  { href: "/clubs", label: "Clubs", icon: Users2 },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/slb", label: "SLB", icon: Landmark },
];

export const adminNavItem: NavItem = { href: "/admin", label: "Admin", icon: ShieldCheck };

/** Starred tabs shown in the header when a user (or guest) has never saved a preference. */
export const DEFAULT_STARRED_NAV: string[] = ["/home", "/events", "/eats"];

/** Header can't grow past this many starred tabs. */
export const MAX_STARRED_NAV = 7;

/** Allowlist check used by the nav-preferences API — `/admin` is only valid for admins. */
export function isValidNavHref(href: string, isAdmin: boolean): boolean {
  if (href === adminNavItem.href) return isAdmin;
  return navItems.some((item) => item.href === href);
}
