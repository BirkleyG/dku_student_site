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
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/professors", label: "Professors", icon: GraduationCap },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/slb", label: "SLB", icon: Landmark },
];

export const adminNavItem: NavItem = { href: "/admin", label: "Admin", icon: ShieldCheck };
