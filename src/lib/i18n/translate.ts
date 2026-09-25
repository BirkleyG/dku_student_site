import type { Locale } from "./locale";
import { defaultLocale } from "./locale";
import { namespaces, type Namespace } from "./dictionaries";

export type TFunction = (key: string, vars?: Record<string, string | number>) => string;

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}

export function makeT(namespace: Namespace, locale: Locale): TFunction {
  const dict = namespaces[namespace];
  return (key, vars) => {
    const template = dict[locale]?.[key] ?? dict[defaultLocale]?.[key] ?? key;
    return interpolate(template, vars);
  };
}
