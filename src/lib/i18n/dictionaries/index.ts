import type { Locale } from "../locale";
import { common } from "./common";
import { nav } from "./nav";
import { auth } from "./auth";
import { home } from "./home";
import { profile } from "./profile";
import { settings } from "./settings";
import { shell } from "./shell";
import { widgets } from "./widgets";
import { clubs } from "./clubs";
import { courses } from "./courses";
import { professors } from "./professors";
import { events } from "./events";
import { wisdom } from "./wisdom";
import { marketplace } from "./marketplace";
import { eats } from "./eats";
import { news } from "./news";
import { slb } from "./slb";
import { admin } from "./admin";

export const namespaces = {
  common,
  nav,
  auth,
  home,
  profile,
  settings,
  shell,
  widgets,
  clubs,
  courses,
  professors,
  events,
  wisdom,
  marketplace,
  eats,
  news,
  slb,
  admin,
} satisfies Record<string, Record<Locale, Record<string, string>>>;

export type Namespace = keyof typeof namespaces;
