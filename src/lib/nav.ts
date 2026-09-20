import { Home, CalendarDays, UtensilsCrossed, MessagesSquare, Newspaper, Compass, Users2, type LucideIcon } from "lucide-react";

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
];
