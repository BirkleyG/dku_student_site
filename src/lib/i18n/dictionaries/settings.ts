import type { Locale } from "../locale";

export const settings: Record<Locale, Record<string, string>> = {
  en: {
    eyebrow: "Settings",
    notificationsHeading: "Notifications",
    notificationsSub:
      "Choose which kinds of push notifications you want to hear from. Turning a category off stops those notifications only — you'll still see the content in the app.",
    couldntSave: "Couldn't save — try again.",
    catEventsLabel: "Events",
    catEventsDescription: "RSVPs, reminders, and updates for events you're going to.",
    catMessagesLabel: "Chat",
    catMessagesDescription: "New messages and thread replies in Chat.",
    catRecommendationsLabel: "Recommendations",
    catRecommendationsDescription: "New Wisdom recommendations and votes on topics you follow.",
    catOrdersLabel: "Orders",
    catOrdersDescription: "Status updates for your DKU Eats orders.",
  },
  zh: {
    eyebrow: "设置",
    notificationsHeading: "通知",
    notificationsSub: "选择你想接收哪些类型的推送通知。关闭某个类别只会停止对应通知——你仍然可以在应用内看到相关内容。",
    couldntSave: "保存失败，请重试。",
    catEventsLabel: "活动",
    catEventsDescription: "你参加的活动的报名确认、提醒和更新。",
    catMessagesLabel: "聊天",
    catMessagesDescription: "聊天中的新消息和话题回复。",
    catRecommendationsLabel: "推荐",
    catRecommendationsDescription: "你关注话题下的新智慧锦囊推荐和投票。",
    catOrdersLabel: "订单",
    catOrdersDescription: "你的 DKU Eats 订单状态更新。",
  },
};
