// Achievement catalog. Pure data (no DB access) so client components can import it.
// Every achievement pays points (see `points`), is unlocked at most once per user, and is
// evaluated by `evaluateAchievements` in src/lib/points.ts.

export type AchievementCondition =
  /** Total number of ledger rows across these keys (activities or signals) >= n. */
  | { kind: "count"; keys: string[]; n: number }
  /** Number of distinct point sources (Events, Wisdom, ...) the user has earned activity points in >= n. */
  | { kind: "sources"; n: number }
  /** Total points (activities + achievements) >= n. */
  | { kind: "total"; n: number }
  /** Number of other achievements unlocked >= n. */
  | { kind: "achievements"; n: number };

export type AchievementArea =
  | "GENERAL"
  | "EVENTS"
  | "EATS"
  | "CHAT"
  | "WISDOM"
  | "DEAR_DKU"
  | "COURSES"
  | "PROFESSORS"
  | "MARKETPLACE"
  | "SLB"
  | "META";

export type AchievementDef = {
  id: string;
  area: AchievementArea;
  emoji: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  points: number;
  when: AchievementCondition;
};

const c = (keys: string | string[], n = 1): AchievementCondition => ({ kind: "count", keys: Array.isArray(keys) ? keys : [keys], n });

export const ACHIEVEMENTS: AchievementDef[] = [
  // --- General / exploring the site
  { id: "tour", area: "GENERAL", emoji: "🧭", name: "Tour de DKU", nameZh: "昆大环游记", description: "Complete the welcome tour.", descriptionZh: "完成新手引导。", points: 15, when: c("TOUR_COMPLETE") },
  { id: "first-widget", area: "GENERAL", emoji: "🧩", name: "Widget Wrangler", nameZh: "小组件驯兽师", description: "Add your first widget to Home.", descriptionZh: "在首页添加第一个小组件。", points: 10, when: c("WIDGET_ADDED") },
  { id: "night-owl", area: "GENERAL", emoji: "🦉", name: "Night Owl", nameZh: "夜猫子", description: "Contribute something between midnight and 5 AM.", descriptionZh: "在凌晨 0 点到 5 点之间做出贡献。", points: 10, when: c("NIGHT_OWL") },
  { id: "vampire", area: "GENERAL", emoji: "🧛", name: "Sunlight Is Overrated", nameZh: "见光死", description: "Be a night owl on 5 different nights.", descriptionZh: "在 5 个不同的夜晚熬夜贡献。", points: 25, when: c("NIGHT_OWL", 5) },
  { id: "early-bird", area: "GENERAL", emoji: "🐦", name: "Early Bird Gets the Points", nameZh: "早起的鸟儿有分拿", description: "Contribute something between 5 and 7 AM.", descriptionZh: "在清晨 5 点到 7 点之间做出贡献。", points: 10, when: c("EARLY_BIRD") },
  { id: "planner", area: "GENERAL", emoji: "🔮", name: "Four-Year Fortune Teller", nameZh: "四年预言家", description: "Create your first academic plan.", descriptionZh: "创建你的第一份学业规划。", points: 10, when: c("PLAN_CREATED") },
  { id: "club", area: "GENERAL", emoji: "🎪", name: "Joiner", nameZh: "社团新人", description: "Join a club.", descriptionZh: "加入一个社团。", points: 10, when: c("CLUB_JOIN") },
  { id: "first-words", area: "CHAT", emoji: "💬", name: "First Words", nameZh: "初次发言", description: "Send your first chat message.", descriptionZh: "发送第一条聊天消息。", points: 5, when: c("CHAT_MESSAGE") },
  { id: "chatterbox", area: "CHAT", emoji: "🦜", name: "Chatterbox", nameZh: "话痨", description: "Send 25 chat messages.", descriptionZh: "发送 25 条聊天消息。", points: 15, when: c("CHAT_MESSAGE", 25) },

  // --- Events
  { id: "first-rsvp", area: "EVENTS", emoji: "🎟️", name: "Show Up Szn", nameZh: "出席狂魔", description: "RSVP to your first event.", descriptionZh: "第一次报名参加活动。", points: 10, when: c("EVENT_RSVP") },
  { id: "rsvp-10", area: "EVENTS", emoji: "🦋", name: "Social Butterfly", nameZh: "社交蝴蝶", description: "RSVP to 10 events.", descriptionZh: "报名参加 10 场活动。", points: 30, when: c("EVENT_RSVP", 10) },
  { id: "host-1", area: "EVENTS", emoji: "🎉", name: "Party Starter", nameZh: "派对发起人", description: "Host your first event.", descriptionZh: "举办你的第一场活动。", points: 20, when: c("EVENT_HOST") },
  { id: "host-5", area: "EVENTS", emoji: "🌌", name: "Event Horizon", nameZh: "事件视界", description: "Host 5 events.", descriptionZh: "举办 5 场活动。", points: 40, when: c("EVENT_HOST", 5) },

  // --- DKU Eats
  { id: "eats-order", area: "EATS", emoji: "🥡", name: "Hangry No More", nameZh: "不再饿怒", description: "Order from DKU Eats.", descriptionZh: "在 DKU Eats 下单。", points: 20, when: c("EATS_ORDER") },
  { id: "eats-order-10", area: "EATS", emoji: "🍜", name: "Regular at the Wok", nameZh: "锅气常客", description: "Place 10 DKU Eats orders.", descriptionZh: "在 DKU Eats 下 10 单。", points: 40, when: c("EATS_ORDER", 10) },
  { id: "eats-run", area: "EATS", emoji: "👨‍🍳", name: "Kitchen Overlord", nameZh: "厨房霸主", description: "Run a restaurant on DKU Eats.", descriptionZh: "在 DKU Eats 经营一家餐厅。", points: 50, when: c("EATS_RUN_RESTAURANT") },

  // --- Chat groups
  { id: "group-1", area: "CHAT", emoji: "📣", name: "Group Chat Founder", nameZh: "群主诞生", description: "Start a chat group.", descriptionZh: "创建一个聊天群。", points: 10, when: c("CHAT_START_GROUP") },
  { id: "group-5", area: "CHAT", emoji: "🐈", name: "Herder of Cats", nameZh: "赶猫人", description: "Start 5 chat groups.", descriptionZh: "创建 5 个聊天群。", points: 25, when: c("CHAT_START_GROUP", 5) },

  // --- Wisdom
  { id: "wisdom-topic", area: "WISDOM", emoji: "🧐", name: "Curious George", nameZh: "好奇宝宝", description: "Start your first Wisdom topic.", descriptionZh: "发起第一个智慧锦囊话题。", points: 15, when: c("WISDOM_TOPIC") },
  { id: "wisdom-rec", area: "WISDOM", emoji: "📍", name: "Local Legend", nameZh: "本地达人", description: "Add your first Wisdom recommendation.", descriptionZh: "添加第一条智慧锦囊推荐。", points: 10, when: c("WISDOM_REC") },
  { id: "wisdom-rec-10", area: "WISDOM", emoji: "🛎️", name: "Human Concierge", nameZh: "人肉礼宾", description: "Add 10 Wisdom recommendations.", descriptionZh: "添加 10 条智慧锦囊推荐。", points: 25, when: c("WISDOM_REC", 10) },
  { id: "wisdom-vote-10", area: "WISDOM", emoji: "🗳️", name: "Democracy Enjoyer", nameZh: "民主爱好者", description: "Vote on 10 recommendations.", descriptionZh: "为 10 条推荐投票。", points: 15, when: c("WISDOM_VOTE", 10) },
  { id: "wisdom-vote-50", area: "WISDOM", emoji: "👍", name: "Thumb Athlete", nameZh: "拇指运动员", description: "Vote on 50 recommendations.", descriptionZh: "为 50 条推荐投票。", points: 30, when: c("WISDOM_VOTE", 50) },

  // --- Dear DKU
  { id: "dear-post", area: "DEAR_DKU", emoji: "📜", name: "Dear Diary", nameZh: "亲爱的日记", description: "Post your first Dear DKU paper.", descriptionZh: "发布第一篇 Dear DKU 文章。", points: 20, when: c("DEAR_POST") },
  { id: "dear-comment", area: "DEAR_DKU", emoji: "🗨️", name: "Reply Guy", nameZh: "回复达人", description: "Comment on a Dear DKU paper.", descriptionZh: "评论一篇 Dear DKU 文章。", points: 10, when: c("DEAR_COMMENT") },
  { id: "dear-comment-10", area: "DEAR_DKU", emoji: "🧙", name: "Comment Section Sage", nameZh: "评论区贤者", description: "Leave 10 Dear DKU comments.", descriptionZh: "留下 10 条 Dear DKU 评论。", points: 25, when: c("DEAR_COMMENT", 10) },

  // --- Courses
  { id: "course-add", area: "COURSES", emoji: "🔎", name: "Syllabus Sleuth", nameZh: "课表侦探", description: "Add a course.", descriptionZh: "添加一门课程。", points: 10, when: c("COURSE_ADD") },
  { id: "course-material", area: "COURSES", emoji: "🎁", name: "Study Santa", nameZh: "学习圣诞老人", description: "Upload course material.", descriptionZh: "上传课程资料。", points: 15, when: c("COURSE_MATERIAL") },
  { id: "course-material-5", area: "COURSES", emoji: "🏛️", name: "Library of Alexandria", nameZh: "亚历山大图书馆", description: "Upload 5 pieces of course material.", descriptionZh: "上传 5 份课程资料。", points: 35, when: c("COURSE_MATERIAL", 5) },
  { id: "course-note", area: "COURSES", emoji: "💡", name: "Tip Top", nameZh: "锦囊妙计", description: "Add a note or a tip and trick to a course.", descriptionZh: "为课程添加笔记或小贴士。", points: 10, when: c("COURSE_NOTE") },

  // --- Professors
  { id: "prof-add", area: "PROFESSORS", emoji: "🕵️", name: "Faculty Scout", nameZh: "教授星探", description: "Add a professor.", descriptionZh: "添加一位教授。", points: 10, when: c("PROF_ADD") },
  { id: "prof-rate", area: "PROFESSORS", emoji: "🖍️", name: "Grade the Grader", nameZh: "给评分的人评分", description: "Rate a professor.", descriptionZh: "评价一位教授。", points: 10, when: c("PROF_RATE") },
  { id: "prof-rate-5", area: "PROFESSORS", emoji: "🧐", name: "Tough Critic", nameZh: "毒舌评论家", description: "Rate 5 professors.", descriptionZh: "评价 5 位教授。", points: 25, when: c("PROF_RATE", 5) },
  { id: "prof-comment", area: "PROFESSORS", emoji: "🪑", name: "Office Hours Regular", nameZh: "答疑时间常客", description: "Comment on a professor.", descriptionZh: "评论一位教授。", points: 10, when: c("PROF_COMMENT") },

  // --- Marketplace
  { id: "market-sell", area: "MARKETPLACE", emoji: "🏷️", name: "Garage Sale Guru", nameZh: "跳蚤市场大师", description: "Sell an item on the Marketplace.", descriptionZh: "在集市卖出一件物品。", points: 15, when: c("MARKET_SELL") },
  { id: "market-buy", area: "MARKETPLACE", emoji: "🛍️", name: "Thrift Champion", nameZh: "淘货冠军", description: "Buy an item on the Marketplace.", descriptionZh: "在集市买下一件物品。", points: 15, when: c("MARKET_BUY") },
  { id: "market-5", area: "MARKETPLACE", emoji: "🤝", name: "Broke but Bargaining", nameZh: "穷但会砍价", description: "Buy or sell 5 Marketplace items.", descriptionZh: "在集市买卖 5 件物品。", points: 30, when: c(["MARKET_SELL", "MARKET_BUY"], 5) },

  // --- Student Leaders Board
  { id: "slb-poll", area: "SLB", emoji: "📮", name: "Ballot Box Bandit", nameZh: "投票箱常客", description: "Take part in an SLB poll.", descriptionZh: "参与一次学生领袖委员会投票。", points: 10, when: c("SLB_POLL") },
  { id: "slb-react", area: "SLB", emoji: "📢", name: "Initiative Enthusiast", nameZh: "倡议热心人", description: "React to an SLB initiative or announcement.", descriptionZh: "对学生领袖委员会的倡议或公告做出回应。", points: 10, when: c("SLB_REACT") },

  // --- Meta milestones
  { id: "renaissance", area: "META", emoji: "🎨", name: "Renaissance Student", nameZh: "文艺复兴学生", description: "Earn points in 5 different areas of DKU Life.", descriptionZh: "在 5 个不同板块获得积分。", points: 40, when: { kind: "sources", n: 5 } },
  { id: "campus-legend", area: "META", emoji: "🏆", name: "Campus Legend", nameZh: "校园传奇", description: "Earn points in 8 different areas of DKU Life.", descriptionZh: "在 8 个不同板块获得积分。", points: 75, when: { kind: "sources", n: 8 } },
  { id: "points-100", area: "META", emoji: "💯", name: "Century Club", nameZh: "百分俱乐部", description: "Reach 100 points.", descriptionZh: "积分达到 100。", points: 20, when: { kind: "total", n: 100 } },
  { id: "points-500", area: "META", emoji: "🐿️", name: "Point Hoarder", nameZh: "积分松鼠", description: "Reach 500 points.", descriptionZh: "积分达到 500。", points: 40, when: { kind: "total", n: 500 } },
  { id: "points-1000", area: "META", emoji: "🐉", name: "Point Dragon", nameZh: "积分之龙", description: "Reach 1,000 points.", descriptionZh: "积分达到 1000。", points: 75, when: { kind: "total", n: 1000 } },
  { id: "trophies-10", area: "META", emoji: "🥇", name: "Trophy Case", nameZh: "奖杯陈列柜", description: "Unlock 10 achievements.", descriptionZh: "解锁 10 个成就。", points: 30, when: { kind: "achievements", n: 10 } },
  { id: "trophies-25", area: "META", emoji: "👑", name: "Completionist", nameZh: "全成就玩家", description: "Unlock 25 achievements.", descriptionZh: "解锁 25 个成就。", points: 60, when: { kind: "achievements", n: 25 } },
];

export const ACHIEVEMENT_BY_ID: Record<string, AchievementDef> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

/** Ledger key for an unlocked achievement. */
export const achievementKey = (id: string) => `ACH:${id}`;
export const isAchievementKey = (key: string) => key.startsWith("ACH:");
