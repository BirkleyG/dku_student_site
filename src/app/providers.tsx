"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { RegisterServiceWorker } from "./RegisterServiceWorker";
import { SmoothScroll } from "@/components/motion/SmoothScroll";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <RegisterServiceWorker />
      <SmoothScroll>{children}</SmoothScroll>
    </SessionProvider>
  );
}
