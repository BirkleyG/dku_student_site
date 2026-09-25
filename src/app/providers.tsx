"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { RegisterServiceWorker } from "./RegisterServiceWorker";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { PushPromptProvider } from "@/components/notifications/PushPromptProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <RegisterServiceWorker />
      <PushPromptProvider>
        <SmoothScroll>{children}</SmoothScroll>
      </PushPromptProvider>
    </SessionProvider>
  );
}
