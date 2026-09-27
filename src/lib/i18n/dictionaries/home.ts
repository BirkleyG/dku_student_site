import type { Locale } from "../locale";

export const home: Record<Locale, Record<string, string>> = {
  en: {
    welcomeBack: "Welcome back, {name}",
    welcome: "Welcome",
    heroHeading: "Events, food, and the mad mix of DKU.",
  },
  zh: {
    welcomeBack: "欢迎回来，{name}",
    welcome: "欢迎",
    heroHeading: "活动、美食，还有 DKU 的精彩混搭。",
  },
};
