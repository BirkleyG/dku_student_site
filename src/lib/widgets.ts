import type { WidgetKind as PrismaWidgetKind } from "@prisma/client";
import {
  Activity, Award, BarChart3, BookOpen, CalendarCheck, CalendarClock, CalendarDays, CalendarPlus, Clock, CloudSun, Coins,
  Compass, Dices, Flame, GraduationCap, History, Hourglass, Landmark, Lightbulb, Link2, Medal, Megaphone,
  MessageCircle, MessageSquarePlus, MessagesSquare, Newspaper, Pin, PenLine, Percent, Phone, Pencil, Radio, Search,
  Send, ShieldCheck, ShoppingBag, Shuffle, Sparkles, Sprout, Star, Sun, Target, ThumbsUp, TrendingUp, Trophy,
  UserRound, Users, UsersRound, UtensilsCrossed, Vote, Wind, Zap, FileText, ClipboardList, Map as MapIcon,
  PartyPopper, Footprints, BellDot, AtSign, Cake, UserCheck, type LucideIcon,
} from "lucide-react";

export type WidgetKind = PrismaWidgetKind;
export type WidgetDisplaySize = "SMALL" | "MEDIUM" | "LARGE";

export type WidgetKindMeta = {
  kind: WidgetKind;
  label: string;
  size: WidgetDisplaySize;
  icon: LucideIcon;
  href: string;
  blurb: string;
  configurable: boolean;
  /** Fed by DKU Eats; shows a "Sample" badge when live Eats data isn't available. */
  eatsData?: boolean;
  /**
   * The tile has its own controls (buttons, inputs, links). It doesn't get the whole-tile "open the page" link
   * overlay; a small Open link sits in the corner instead.
   */
  interactive?: boolean;
  /** Only offered in the gallery to admins; its data is only ever loaded for admins. */
  adminOnly?: boolean;
};

const coreWidgets: Record<string, WidgetKindMeta> = {
  EVENTS_TALLY: {
    kind: "EVENTS_TALLY",
    label: "Events tally",
    size: "SMALL",
    icon: CalendarDays,
    href: "/events",
    blurb: "A count of events matching a filter — today or this week. Add a few to track different categories.",
    configurable: true,
  },
  EVENTS_AGENDA: {
    kind: "EVENTS_AGENDA",
    label: "Today's agenda",
    size: "LARGE",
    icon: CalendarDays,
    href: "/events",
    blurb: "What's on the calendar today, in order, with the current time.",
    configurable: false,
  },
  EATS_OPEN_COUNT: {
    kind: "EATS_OPEN_COUNT",
    label: "Restaurants open",
    size: "MEDIUM",
    icon: UtensilsCrossed,
    href: "/eats",
    blurb: "How many DKU Eats restaurants are open right now.",
    configurable: false,
    eatsData: true,
  },
  EATS_FAVORITE: {
    kind: "EATS_FAVORITE",
    label: "Favorite restaurant",
    size: "SMALL",
    icon: UtensilsCrossed,
    href: "/eats",
    blurb: "One tap to your go-to spot on DKU Eats.",
    configurable: true,
    eatsData: true,
  },
  EATS_ORDER_TRACKER: {
    kind: "EATS_ORDER_TRACKER",
    label: "Order tracker",
    size: "MEDIUM",
    icon: UtensilsCrossed,
    href: "/eats",
    blurb: "Live status of your current DKU Eats order.",
    configurable: false,
    eatsData: true,
  },
  EATS_ACTIVITY: {
    kind: "EATS_ACTIVITY",
    label: "Eats activity",
    size: "MEDIUM",
    icon: UtensilsCrossed,
    href: "/eats",
    blurb: "What's being ordered around campus right now.",
    configurable: false,
    eatsData: true,
  },
  CHAT_LATEST: {
    kind: "CHAT_LATEST",
    label: "Latest message",
    size: "SMALL",
    icon: MessagesSquare,
    href: "/chat",
    blurb: "The single most recent message across your chats.",
    configurable: false,
  },
  CHAT_RECENT: {
    kind: "CHAT_RECENT",
    label: "Recent messages",
    size: "LARGE",
    icon: MessagesSquare,
    href: "/chat",
    blurb: "A running feed of the latest messages across your chats.",
    configurable: false,
  },
  CHAT_TRACKED_CHANNEL: {
    kind: "CHAT_TRACKED_CHANNEL",
    label: "Track a channel",
    size: "SMALL",
    icon: MessagesSquare,
    href: "/chat",
    blurb: "Pick a channel and see how many new messages it's gotten since.",
    configurable: true,
  },
  LILYPAD_LATEST: {
    kind: "LILYPAD_LATEST",
    label: "Latest from the Lilypad",
    size: "LARGE",
    icon: Newspaper,
    href: "/news",
    blurb: "The newest articles from DKU's independent student publication. Pick a category or show them all.",
    configurable: true,
  },
};


type Extra = Pick<WidgetKindMeta, "configurable" | "eatsData" | "interactive" | "adminOnly">;
const def = (
  kind: WidgetKind,
  label: string,
  size: WidgetDisplaySize,
  icon: LucideIcon,
  href: string,
  blurb: string,
  extra: Partial<Extra> = {},
): [WidgetKind, WidgetKindMeta] => [kind, { kind, label, size, icon, href, blurb, configurable: false, ...extra }];

const moreWidgets = Object.fromEntries([
  // Events
  def("EVENTS_NEXT_RSVP", "Next RSVP'd event", "SMALL", CalendarClock, "/events", "Countdown to the next event you've RSVP'd to."),
  def("EVENTS_MY_WEEK", "My week", "MEDIUM", CalendarCheck, "/events", "The events you've RSVP'd to this week."),
  def("EVENTS_HOST_LAUNCH", "Host an event", "SMALL", CalendarPlus, "/events/new", "One tap to start planning your own event."),
  def("EVENTS_TRENDING", "Trending events", "MEDIUM", Flame, "/events", "Upcoming events with the most RSVPs right now."),
  def("EVENTS_HOSTING", "Events you host", "MEDIUM", UsersRound, "/events", "How many people have RSVP'd to your upcoming events."),
  def("EVENTS_HAPPENING_NOW", "Happening now", "MEDIUM", Radio, "/events", "Events on right now or starting within the hour."),
  def("EVENTS_DEADLINE", "Registration deadline", "SMALL", Hourglass, "/events", "Countdown to the next registration or add/drop deadline on the calendar."),
  // SLB
  def("SLB_LATEST", "Latest from SLB", "MEDIUM", Megaphone, "/slb", "The newest announcement from the Student Leaders Board."),
  def("SLB_POLL", "SLB poll", "LARGE", Vote, "/slb?tab=polls", "The current SLB poll — vote right from your dashboard.", { interactive: true }),
  def("SLB_TRENDING", "Trending initiative", "MEDIUM", TrendingUp, "/slb?tab=initiatives", "The SLB initiative with the most backers. SLB members can back it in one tap.", { interactive: true }),
  // News
  def("LILYPAD_HEADLINE", "Latest headline", "SMALL", Newspaper, "/news", "The single newest Lilypad headline."),
  def("LILYPAD_TICKER", "Headline ticker", "MEDIUM", Newspaper, "/news", "Rotates through the latest Lilypad articles."),
  // Wisdom
  def("WISDOM_TOP", "Top-rated tip", "MEDIUM", ThumbsUp, "/wisdom", "The best-rated Wisdom recommendation right now."),
  def("WISDOM_TALLY", "Tips this week", "SMALL", BarChart3, "/wisdom", "How many tips were shared this week in a category you pick.", { configurable: true }),
  def("WISDOM_SURPRISE", "Surprise me", "MEDIUM", Shuffle, "/wisdom", "A random Wisdom tip. Tap to shuffle.", { interactive: true }),
  def("WISDOM_DAILY", "Tip of the day", "MEDIUM", Sun, "/wisdom", "One Wisdom tip a day — the same for everyone."),
  def("WISDOM_NEWEST", "Newest tip", "MEDIUM", Sparkles, "/wisdom", "The latest tip in a Wisdom category you pick.", { configurable: true }),
  def("WISDOM_UPVOTES", "Your tip upvotes", "SMALL", Star, "/wisdom", "Total upvotes on the tips you've shared."),
  def("WISDOM_SHARE", "Share a tip", "LARGE", Lightbulb, "/wisdom", "Add a Wisdom recommendation without leaving Home.", { interactive: true }),
  // Friends
  def("FRIENDS_ONLINE", "Friends online", "MEDIUM", UserCheck, "/home", "Which of your friends have the site open right now.", { interactive: true }),
  def("FRIENDS_ACTIVITY", "Friend updates", "MEDIUM", Users, "/home", "What the people you follow have been up to.", { interactive: true }),
  def("FRIENDS_BIRTHDAYS", "Friends' birthdays", "MEDIUM", Cake, "/home", "Upcoming birthdays of friends who chose to share them."),
  // Clubs
  def("CLUBS_SPOTLIGHT", "Club of the week", "MEDIUM", Star, "/clubs", "A different club in the spotlight every week."),
  def("CLUBS_MINE", "My clubs", "MEDIUM", UsersRound, "/clubs", "Quick links to the clubs you've joined.", { interactive: true }),
  def("CLUBS_NEWEST", "Newest clubs", "MEDIUM", Sprout, "/clubs", "Recently added clubs and organizations."),
  // DKU Eats
  def("EATS_RANDOM", "Where should I eat?", "MEDIUM", Dices, "/eats", "Picks a random open kitchen for you.", { eatsData: true, interactive: true }),
  def("EATS_BUSY", "Busiest & quietest", "MEDIUM", Activity, "/eats", "Which kitchen is slammed right now, and which is quiet.", { eatsData: true }),
  def("EATS_LAST_ORDER", "Last order", "MEDIUM", History, "/eats", "Your most recent DKU Eats order, with a shortcut to order again.", { eatsData: true, interactive: true }),
  // Chat
  def("CHAT_COMPOSER", "Quick post", "MEDIUM", Send, "/chat", "Post to the DKU Life board straight from Home.", { interactive: true }),
  def("CHAT_PINNED", "Pinned chat", "SMALL", Pin, "/chat", "The latest message from one chat you pick.", { configurable: true }),
  def("CHAT_INVITES", "Group invites", "SMALL", MessageSquarePlus, "/chat", "Chat groups waiting for you to accept or decline."),
  def("CHAT_UNREAD", "Unread messages", "SMALL", BellDot, "/chat", "How many messages are waiting across your chats."),
  def("CHAT_MENTIONS", "Mentions", "MEDIUM", AtSign, "/chat", "Messages where someone @mentioned you."),
  def("CHAT_DM", "Message someone", "MEDIUM", MessageCircle, "/chat", "Find a person and jump into a direct message.", { interactive: true }),
  // Dear DKU
  def("DEAR_LATEST", "Latest Dear DKU", "MEDIUM", PenLine, "/dear-dku", "The newest piece published on Dear DKU."),
  def("DEAR_COMMENTED", "Most discussed", "MEDIUM", MessagesSquare, "/dear-dku", "The Dear DKU pieces with the most comments this week."),
  def("DEAR_WRITE", "Write for Dear DKU", "SMALL", Pencil, "/dear-dku/new", "One tap to submit your own piece."),
  def("DEAR_RANDOM", "Random Dear DKU", "MEDIUM", Shuffle, "/dear-dku", "A random piece from Dear DKU. Tap to shuffle.", { interactive: true }),
  // Courses
  def("COURSES_COMMENTS", "Course chatter", "MEDIUM", MessagesSquare, "/courses", "The latest comments on course pages."),
  def("COURSES_SEARCH", "Course search", "MEDIUM", Search, "/courses", "Type a course and jump straight to the directory.", { interactive: true }),
  def("COURSES_RESOURCES", "New course resources", "MEDIUM", FileText, "/courses", "Notes, exams and guides newly shared for the courses in your plan."),
  // Professors
  def("PROFESSORS_SPOTLIGHT", "Top-rated professor", "MEDIUM", Trophy, "/professors", "The professor students rate highest."),
  def("PROFESSORS_REVIEWS", "Latest reviews", "MEDIUM", MessagesSquare, "/professors", "The newest professor reviews."),
  def("PROFESSORS_TO_RATE", "Rate your professors", "MEDIUM", GraduationCap, "/professors", "Professors for courses in your plan that you haven't reviewed yet.", { interactive: true }),
  // Planner
  def("PLANNER_CREDITS", "Credits progress", "SMALL", Percent, "/planner", "How far your plan gets you toward the 136 credits you need."),
  def("PLANNER_SEMESTERS", "Semesters planned", "MEDIUM", ClipboardList, "/planner", "How many of your eight semesters have courses, and the next empty one."),
  // Profile
  def("PROFILE_POINTS", "Total points", "SMALL", Zap, "/profile", "Your community points."),
  def("PROFILE_ACHIEVEMENTS", "Achievements", "SMALL", Award, "/profile", "How many achievements you've unlocked."),
  def("PROFILE_LEADERBOARD", "Leaderboard", "MEDIUM", Trophy, "/profile", "Your rank and the top three on campus."),
  def("PROFILE_NEXT_ACHIEVEMENT", "Next achievement", "MEDIUM", Target, "/profile", "The achievement you're closest to unlocking."),
  def("PROFILE_RECENT_POINTS", "Recent points", "MEDIUM", Activity, "/profile", "The last few ways you earned points."),
  def("PROFILE_SHOWCASE", "Achievement showcase", "MEDIUM", Medal, "/profile", "Your rarest unlocked achievement."),
  def("PROFILE_RECAP", "Semester recap", "MEDIUM", PartyPopper, "/profile", "A quick look back at your last finished semester."),
  // Campus & general
  def("CAMPUS_QUICK_LINKS", "Quick links", "MEDIUM", Link2, "/home", "Shortcut tiles to any tab you pick.", { configurable: true, interactive: true }),
  def("CAMPUS_BREAK_COUNTDOWN", "Next break", "SMALL", Footprints, "/events", "Days until the next break or holiday."),
  def("CAMPUS_SEMESTER_PROGRESS", "Semester progress", "MEDIUM", Compass, "/events", "How far through the semester you are."),
  def("CAMPUS_DUAL_CLOCK", "Dual clock", "SMALL", Clock, "/home", "Kunshan time next to your home time zone.", { configurable: true }),
  def("CAMPUS_WEATHER", "Kunshan weather", "SMALL", CloudSun, "/home", "Current conditions and today's high and low in Kunshan."),
  def("CAMPUS_AIR_QUALITY", "Air quality", "SMALL", Wind, "/home", "Kunshan's air quality index right now."),
  def("CAMPUS_LOGIN_STREAK", "Login streak", "SMALL", Flame, "/home", "How many days in a row you've opened your dashboard."),
  def("CAMPUS_CURRENCY", "Currency converter", "MEDIUM", Coins, "/home", "Convert yuan to your home currency.", { configurable: true, interactive: true }),
  def("CAMPUS_CONTACTS", "Important contacts", "MEDIUM", Phone, "/home", "Emergency numbers and campus help lines, one tap to call.", { interactive: true }),
  def("MARKET_POST_LAUNCH", "Sell something", "SMALL", ShoppingBag, "/marketplace", "One tap to the Marketplace to list an item."),
  // Admin
  def("ADMIN_ACTIVE_USERS", "Active users", "SMALL", ShieldCheck, "/admin", "How many people opened their dashboard today and this week.", { adminOnly: true }),
]) as Record<string, WidgetKindMeta>;

export const widgetCatalog = { ...coreWidgets, ...moreWidgets } as Record<WidgetKind, WidgetKindMeta>;

export type WidgetGroup = {
  key: string;
  label: string;
  icon: LucideIcon;
  kinds: WidgetKind[];
};

export const widgetGroups: WidgetGroup[] = [
  {
    key: "events",
    label: "Events",
    icon: CalendarDays,
    kinds: [
      "EVENTS_AGENDA", "EVENTS_TALLY", "EVENTS_NEXT_RSVP", "EVENTS_MY_WEEK", "EVENTS_HAPPENING_NOW",
      "EVENTS_TRENDING", "EVENTS_HOSTING", "EVENTS_DEADLINE", "EVENTS_HOST_LAUNCH",
    ],
  },
  {
    key: "eats",
    label: "DKU Eats",
    icon: UtensilsCrossed,
    kinds: ["EATS_OPEN_COUNT", "EATS_FAVORITE", "EATS_ORDER_TRACKER", "EATS_ACTIVITY", "EATS_RANDOM", "EATS_BUSY", "EATS_LAST_ORDER"],
  },
  {
    key: "chat",
    label: "Chat",
    icon: MessagesSquare,
    kinds: [
      "CHAT_LATEST", "CHAT_RECENT", "CHAT_UNREAD", "CHAT_MENTIONS", "CHAT_TRACKED_CHANNEL", "CHAT_COMPOSER", "CHAT_PINNED",
      "CHAT_INVITES", "CHAT_DM",
    ],
  },
  { key: "friends", label: "Friends", icon: Users, kinds: ["FRIENDS_ONLINE", "FRIENDS_ACTIVITY", "FRIENDS_BIRTHDAYS"] },
  { key: "lilypad", label: "The Lilypad", icon: Newspaper, kinds: ["LILYPAD_LATEST", "LILYPAD_HEADLINE", "LILYPAD_TICKER"] },
  {
    key: "wisdom",
    label: "Wisdom",
    icon: Compass,
    kinds: ["WISDOM_TOP", "WISDOM_DAILY", "WISDOM_SURPRISE", "WISDOM_NEWEST", "WISDOM_TALLY", "WISDOM_UPVOTES", "WISDOM_SHARE"],
  },
  { key: "dear-dku", label: "Dear DKU", icon: Pencil, kinds: ["DEAR_LATEST", "DEAR_COMMENTED", "DEAR_RANDOM", "DEAR_WRITE"] },
  { key: "clubs", label: "Clubs", icon: Users, kinds: ["CLUBS_SPOTLIGHT", "CLUBS_MINE", "CLUBS_NEWEST"] },
  { key: "courses", label: "Courses", icon: BookOpen, kinds: ["COURSES_COMMENTS", "COURSES_RESOURCES", "COURSES_SEARCH"] },
  { key: "professors", label: "Professors", icon: GraduationCap, kinds: ["PROFESSORS_SPOTLIGHT", "PROFESSORS_REVIEWS", "PROFESSORS_TO_RATE"] },
  { key: "planner", label: "Planner", icon: MapIcon, kinds: ["PLANNER_CREDITS", "PLANNER_SEMESTERS"] },
  {
    key: "profile",
    label: "Profile",
    icon: UserRound,
    kinds: [
      "PROFILE_POINTS", "PROFILE_ACHIEVEMENTS", "PROFILE_LEADERBOARD", "PROFILE_NEXT_ACHIEVEMENT",
      "PROFILE_RECENT_POINTS", "PROFILE_SHOWCASE", "PROFILE_RECAP",
    ],
  },
  { key: "slb", label: "SLB", icon: Landmark, kinds: ["SLB_LATEST", "SLB_POLL", "SLB_TRENDING"] },
  { key: "marketplace", label: "Marketplace", icon: ShoppingBag, kinds: ["MARKET_POST_LAUNCH"] },
  {
    key: "campus",
    label: "Campus",
    icon: Sun,
    kinds: [
      "CAMPUS_WEATHER", "CAMPUS_AIR_QUALITY", "CAMPUS_DUAL_CLOCK", "CAMPUS_BREAK_COUNTDOWN", "CAMPUS_SEMESTER_PROGRESS",
      "CAMPUS_LOGIN_STREAK", "CAMPUS_QUICK_LINKS", "CAMPUS_CURRENCY", "CAMPUS_CONTACTS",
    ],
  },
  { key: "admin", label: "Admin", icon: ShieldCheck, kinds: ["ADMIN_ACTIVE_USERS"] },
];

export const sizeSpec: Record<WidgetDisplaySize, { className: string }> = {
  SMALL: { className: "col-span-1 row-span-1" },
  MEDIUM: { className: "col-span-2 row-span-1" },
  LARGE: { className: "col-span-2 row-span-2" },
};

/** A widget "instance" placed on someone's dashboard. */
export type WidgetInstance = {
  id: string;
  kind: WidgetKind;
  config: Record<string, unknown>;
};

/** Sensible starting config for a freshly-added widget of this kind. */
export function defaultConfigFor(kind: WidgetKind): Record<string, unknown> {
  switch (kind) {
    case "EVENTS_TALLY":
      return { categories: [], timeframe: "today" };
    case "EATS_FAVORITE":
      return {};
    case "LILYPAD_LATEST":
      return { categoryId: null };
    case "WISDOM_TALLY":
    case "WISDOM_NEWEST":
      return { category: "FOOD" };
    case "CHAT_PINNED":
      return { channelId: "general" };
    case "CAMPUS_DUAL_CLOCK":
      return { timeZone: "America/New_York" };
    case "CAMPUS_CURRENCY":
      return { currency: "USD" };
    case "CAMPUS_QUICK_LINKS":
      return { hrefs: ["/events", "/eats", "/chat", "/courses"] };
    default:
      return {};
  }
}

export function hrefForInstance(instance: WidgetInstance): string {
  return widgetCatalog[instance.kind].href;
}

export const defaultLayout: Array<{ kind: WidgetKind; config?: Record<string, unknown> }> = [
  { kind: "EVENTS_AGENDA" },
  { kind: "EATS_OPEN_COUNT" },
  { kind: "EVENTS_TALLY", config: { categories: [], timeframe: "today" } },
  { kind: "EVENTS_TALLY", config: { categories: ["CLUBS"], timeframe: "week" } },
  { kind: "CHAT_LATEST" },
  { kind: "EATS_FAVORITE", config: {} },
  { kind: "LILYPAD_LATEST", config: { categoryId: null } },
];
