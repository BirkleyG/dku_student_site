"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { RegisterServiceWorker } from "./RegisterServiceWorker";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { LocaleProvider } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/locale";

export function Providers({ children, locale }: { children: ReactNode; locale: Locale }) {
  return (
    <LocaleProvider initialLocale={locale}>
      <SessionProvider>
        <RegisterServiceWorker />
        <SmoothScroll>{children}</SmoothScroll>
      </SessionProvider>
    </LocaleProvider>
  );
}
