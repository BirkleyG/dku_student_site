"use client";

import { useState, type ReactNode } from "react";

export function TabsShell({ tabs }: { tabs: { key: string; label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.key);

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-ink/10 pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`focus-ring rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active === tab.key ? "bg-ink text-white" : "text-ink/60 hover:bg-paper-dim"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">{tabs.find((t) => t.key === active)?.content}</div>
    </div>
  );
}
