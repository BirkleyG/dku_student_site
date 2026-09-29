import type { Locale } from "../locale";

export const profile: Record<Locale, Record<string, string>> = {
  en: {
    yourProfile: "Your profile",
    communityScore: "DKU Life points",
    rankOnCampus: "#{rank} on campus",
    howYouEarnedIt: "How you've earned it",
    recentActivity: "Recent activity",
    noActivityYet: "RSVP to an event, post a rec, rate a professor, or share course resources to start earning points.",
    language: "Language",
    achievements: "Achievements",
    achievementsUnlocked: "{unlocked} of {total} unlocked",
    achievementsBonus: "{count} achievement bonuses",
    unlockedOn: "unlocked {date}",
    locked: "locked",
  },
  zh: {
    yourProfile: "我的主页",
    communityScore: "DKU Life 积分",
    rankOnCampus: "全校排名 #{rank}",
    howYouEarnedIt: "积分获取方式",
    recentActivity: "最近动态",
    noActivityYet: "报名活动、发布推荐、给教授评分或分享课程资源，即可开始获得积分。",
    language: "语言",
    achievements: "成就",
    achievementsUnlocked: "已解锁 {unlocked} / {total}",
    achievementsBonus: "{count} 个成就奖励",
    unlockedOn: "解锁于 {date}",
    locked: "未解锁",
  },
};
