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
  BookOpen,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  /** Key into the "nav" i18n dictionary; falls back to `label` when absent. */
  labelKey: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/home", label: "Home", labelKey: "home", icon: Home },
  { href: "/events", label: "Events", labelKey: "events", icon: CalendarDays },
  { href: "/eats", label: "DKU Eats", labelKey: "eats", icon: UtensilsCrossed },
  { href: "/chat", label: "Chat", labelKey: "chat", icon: MessagesSquare },
  { href: "/news", label: "News", labelKey: "news", icon: Newspaper },
  { href: "/wisdom", label: "Wisdom", labelKey: "wisdom", icon: Compass },
  { href: "/clubs", label: "Clubs", labelKey: "clubs", icon: Users2 },
  { href: "/courses", label: "Courses", labelKey: "courses", icon: BookOpen },
  { href: "/professors", label: "Professors", labelKey: "professors", icon: GraduationCap },
  { href: "/marketplace", label: "Marketplace", labelKey: "marketplace", icon: ShoppingBag },
  { href: "/slb", label: "SLB", labelKey: "slb", icon: Landmark },
];

export const adminNavItem: NavItem = { href: "/admin", label: "Admin", labelKey: "admin", icon: ShieldCheck };

/** Starred tabs shown in the header when a user (or guest) has never saved a preference. */
export const DEFAULT_STARRED_NAV: string[] = ["/home", "/events", "/eats"];

/** Header can't grow past this many starred tabs. */
export const MAX_STARRED_NAV = 7;

/** Allowlist check used by the nav-preferences API — `/admin` is only valid for admins. */
export function isValidNavHref(href: string, isAdmin: boolean): boolean {
  if (href === adminNavItem.href) return isAdmin;
  return navItems.some((item) => item.href === href);
}
