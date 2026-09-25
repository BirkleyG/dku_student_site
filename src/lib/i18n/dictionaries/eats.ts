import type { Locale } from "../locale";

export const eats: Record<Locale, Record<string, string>> = {
  en: {
    embedTitle: "DKU Eats",
    loading: "Loading DKU Eats…",
    openInNewTab: "Open DKU Eats in a new tab",
    guestNote: "Log in to DKU Life to skip DKU Eats' own login.",
    dismiss: "Dismiss",
  },
  zh: {
    embedTitle: "DKU 美食",
    loading: "正在加载 DKU 美食…",
    openInNewTab: "在新标签页中打开 DKU 美食",
    guestNote: "登录 DKU Life 即可跳过 DKU 美食自己的登录步骤。",
    dismiss: "关闭",
  },
};
