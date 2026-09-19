export type NavItem = {
  href: string;
  label: string;
  emoji: string;
};

export const navItems: NavItem[] = [
  { href: "/home", label: "Home", emoji: "🏠" },
  { href: "/events", label: "Events", emoji: "🎉" },
  { href: "/eats", label: "DKU Eats", emoji: "🥟" },
  { href: "/social", label: "Board", emoji: "💬" },
  { href: "/news", label: "News", emoji: "📰" },
  { href: "/wisdom", label: "Wisdom", emoji: "🧭" },
  { href: "/clubs", label: "Clubs", emoji: "🎭" },
];
