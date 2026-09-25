import type { Locale } from "../locale";

export const news: Record<Locale, Record<string, string>> = {
  en: {
    pageTitle: "Straight from the Lilypad.",
    pageSubtitle:
      "The latest from DKU's independent student publication — synced live, opens on The Lilypad.",
    allCategory: "All",
    searchPlaceholder: "Search articles…",
    loadingArticles: "Loading articles…",
    noArticles: "No articles found.",
    loadMore: "Load more",
    loadingMore: "Loading…",
    readOnLilypad: "Read on The Lilypad",
  },
  zh: {
    pageTitle: "来自 Lilypad 的最新消息",
    pageSubtitle: "DKU 独立学生媒体 The Lilypad 的最新内容——实时同步，点击后在 The Lilypad 打开。",
    allCategory: "全部",
    searchPlaceholder: "搜索文章…",
    loadingArticles: "文章加载中…",
    noArticles: "未找到相关文章。",
    loadMore: "加载更多",
    loadingMore: "加载中…",
    readOnLilypad: "在 The Lilypad 阅读",
  },
};
