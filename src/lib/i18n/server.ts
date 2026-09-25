import { cookies } from "next/headers";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./locale";
import { makeT, type TFunction } from "./translate";
import type { Namespace } from "./dictionaries";

export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}

export async function getT(namespace: Namespace): Promise<TFunction> {
  const locale = await getServerLocale();
  return makeT(namespace, locale);
}
