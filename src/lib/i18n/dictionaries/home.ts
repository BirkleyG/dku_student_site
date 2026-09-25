import type { Locale } from "../locale";

export const home: Record<Locale, Record<string, string>> = {
  en: {
    welcomeBack: "Welcome back, {name}",
    welcome: "Welcome",
    heroHeading: "Events, food, and everyone's dorm gossip.",
  },
  zh: {
    welcomeBack: "欢迎回来，{name}",
    welcome: "欢迎",
    heroHeading: "活动、美食，还有大家的宿舍八卦。",
  },
};
