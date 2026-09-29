// Pure (client-safe) catalog of what earns points. The server-side ledger lives in src/lib/points.ts.

export type PointSource =
  | "EVENTS"
  | "EATS"
  | "CHAT"
  | "WISDOM"
  | "DEAR_DKU"
  | "COURSES"
  | "PROFESSORS"
  | "MARKETPLACE"
  | "SLB"
  | "ACHIEVEMENTS";

export const POINT_SOURCES: PointSource[] = [
  "EVENTS",
  "EATS",
  "CHAT",
  "WISDOM",
  "DEAR_DKU",
  "COURSES",
  "PROFESSORS",
  "MARKETPLACE",
  "SLB",
  "ACHIEVEMENTS",
];

export const SOURCE_LABELS: Record<PointSource, { en: string; zh: string }> = {
  EVENTS: { en: "Events", zh: "活动" },
  EATS: { en: "DKU Eats", zh: "DKU Eats" },
  CHAT: { en: "Chat", zh: "聊天" },
  WISDOM: { en: "Wisdom", zh: "智慧锦囊" },
  DEAR_DKU: { en: "Dear DKU", zh: "Dear DKU" },
  COURSES: { en: "Courses", zh: "课程" },
  PROFESSORS: { en: "Professors", zh: "教授" },
  MARKETPLACE: { en: "Marketplace", zh: "集市" },
  SLB: { en: "Student Leaders Board", zh: "学生领袖委员会" },
  ACHIEVEMENTS: { en: "Achievements", zh: "成就奖励" },
};

export type ActivityRule = {
  source: Exclude<PointSource, "ACHIEVEMENTS">;
  points: number;
  label: string;
  labelZh: string;
  /** Anti-spam: max ledger rows of this key per user per campus day (for repeatable, low-effort actions). */
  dailyCap?: number;
};

export const ACTIVITY_RULES = {
  EVENT_HOST: { source: "EVENTS", points: 25, label: "Hosted an event", labelZh: "举办活动" },
  EVENT_RSVP: { source: "EVENTS", points: 5, label: "RSVPed to an event", labelZh: "报名活动", dailyCap: 20 },
  EATS_RUN_RESTAURANT: { source: "EATS", points: 500, label: "Runs a restaurant on DKU Eats", labelZh: "在 DKU Eats 经营餐厅" },
  EATS_ORDER: { source: "EATS", points: 15, label: "Ordered from DKU Eats", labelZh: "在 DKU Eats 下单" },
  CHAT_START_GROUP: { source: "CHAT", points: 5, label: "Started a chat group", labelZh: "创建聊天群", dailyCap: 5 },
  WISDOM_TOPIC: { source: "WISDOM", points: 25, label: "Started a Wisdom topic", labelZh: "发起智慧锦囊话题", dailyCap: 5 },
  WISDOM_REC: { source: "WISDOM", points: 5, label: "Added a Wisdom recommendation", labelZh: "添加智慧锦囊推荐", dailyCap: 10 },
  WISDOM_VOTE: { source: "WISDOM", points: 1, label: "Voted on a recommendation", labelZh: "为推荐投票", dailyCap: 30 },
  DEAR_POST: { source: "DEAR_DKU", points: 35, label: "Posted a Dear DKU paper", labelZh: "发布 Dear DKU 文章", dailyCap: 3 },
  DEAR_COMMENT: { source: "DEAR_DKU", points: 5, label: "Commented on a Dear DKU paper", labelZh: "评论 Dear DKU 文章", dailyCap: 10 },
  COURSE_ADD: { source: "COURSES", points: 10, label: "Added a course", labelZh: "添加课程", dailyCap: 10 },
  COURSE_MATERIAL: { source: "COURSES", points: 15, label: "Uploaded course material", labelZh: "上传课程资料", dailyCap: 10 },
  COURSE_NOTE: { source: "COURSES", points: 5, label: "Added a course note or tip", labelZh: "添加课程笔记/贴士", dailyCap: 10 },
  PROF_ADD: { source: "PROFESSORS", points: 10, label: "Added a professor", labelZh: "添加教授", dailyCap: 10 },
  PROF_RATE: { source: "PROFESSORS", points: 5, label: "Rated a professor", labelZh: "评价教授", dailyCap: 10 },
  PROF_COMMENT: { source: "PROFESSORS", points: 5, label: "Commented on a professor", labelZh: "评论教授", dailyCap: 10 },
  MARKET_SELL: { source: "MARKETPLACE", points: 15, label: "Sold an item", labelZh: "卖出物品" },
  MARKET_BUY: { source: "MARKETPLACE", points: 15, label: "Bought an item", labelZh: "买下物品" },
  SLB_POLL: { source: "SLB", points: 5, label: "Took part in a poll", labelZh: "参与投票" },
  SLB_REACT: { source: "SLB", points: 5, label: "Reacted to an initiative or announcement", labelZh: "回应倡议/公告" },
} as const satisfies Record<string, ActivityRule>;

export type ActivityKey = keyof typeof ACTIVITY_RULES;
export const ACTIVITY_KEYS = Object.keys(ACTIVITY_RULES) as ActivityKey[];

/**
 * Zero-point "signals": facts that achievements are built on but that don't pay points themselves
 * (the achievement does). Stored in the ledger with kind SIGNAL.
 */
export const SIGNAL_KEYS = [
  "TOUR_COMPLETE",
  "WIDGET_ADDED",
  "NIGHT_OWL",
  "EARLY_BIRD",
  "PLAN_CREATED",
  "CLUB_JOIN",
  "CHAT_MESSAGE",
] as const;
export type SignalKey = (typeof SIGNAL_KEYS)[number];

/** Keys external apps (DKU Eats, Marketplace) may report through the signed webhook. */
export const EXTERNAL_KEYS: ActivityKey[] = ["EATS_ORDER", "EATS_RUN_RESTAURANT", "MARKET_SELL", "MARKET_BUY"];

export function isActivityKey(key: string): key is ActivityKey {
  return Object.prototype.hasOwnProperty.call(ACTIVITY_RULES, key);
}
