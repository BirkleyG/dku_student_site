"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { RegisterServiceWorker } from "./RegisterServiceWorker";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <RegisterServiceWorker />
      {children}
    </SessionProvider>
  );
}
