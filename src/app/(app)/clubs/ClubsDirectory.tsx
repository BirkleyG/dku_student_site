"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import {
  clubCategories,
  clubCategoryLabels,
  groupTypes,
  groupTypeLabels,
  athleticKindLabels,
} from "@/lib/club-validation";

type ApiClub = {
  id: string;
  type: (typeof groupTypes)[number];
  name: string;
  category: (typeof clubCategories)[number];
  athleticKind: keyof typeof athleticKindLabels | null;
  sportName: string | null;
  description: string;
  logoUrl: string | null;
  officers: { name: string; title: string }[];
  _count: { members: number };
};

export function ClubsDirectory() {
  const [clubs, setClubs] = useState<ApiClub[] | null>(null);
  const [type, setType] = useState<(typeof groupTypes)[number] | "ALL">("ALL");
  const [category, setCategory] = useState<(typeof clubCategories)[number] | "ALL">("ALL");

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (category !== "ALL") params.set("category", category);
    if (type !== "ALL") params.set("type", type);
    const qs = params.toString();
    fetch(`/api/clubs${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setClubs(data.clubs ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [category, type]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={type === "ALL"} onClick={() => setType("ALL")}>
          Everything
        </FilterChip>
        {groupTypes.map((t) => (
          <FilterChip key={t} active={type === t} onClick={() => setType(t)}>
            {groupTypeLabels[t]}s
          </FilterChip>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <FilterChip active={category === "ALL"} onClick={() => setCategory("ALL")}>
          All categories
        </FilterChip>
        {clubCategories.map((c) => (
          <FilterChip key={c} active={category === c} onClick={() => setCategory(c)}>
            {clubCategoryLabels[c]}
          </FilterChip>
        ))}
      </div>

      {clubs === null ? (
        <p className="mt-10 text-sm text-ink/40">Loading…</p>
      ) : clubs.length === 0 ? (
        <p className="mt-10 text-ink/50">Nothing here yet. Add the first one.</p>
      ) : (
        <StaggerGroup className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => {
            const president = club.officers[0];
            return (
              <StaggerItem key={club.id}>
                <Link href={`/clubs/${club.id}`} className="block h-full">
                  <Card className="flex h-full flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <span className="w-fit rounded-full bg-sprout/25 px-2.5 py-0.5 text-xs font-medium text-sprout-deep">
                        {clubCategoryLabels[club.category]}
                        {club.athleticKind ? ` · ${athleticKindLabels[club.athleticKind]}` : ""}
                      </span>
                      {club.type === "ORGANIZATION" ? (
                        <span className="rounded-full border border-ink/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-ink/50">
                          Organization
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      {club.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={club.logoUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      ) : null}
                      <h3 className="font-display text-2xl">{club.name}</h3>
                    </div>
                    {club.sportName ? <p className="mt-1 text-xs text-ink/50">{club.sportName}</p> : null}
                    <p className="mt-1.5 line-clamp-3 flex-1 text-sm text-ink/65">{club.description}</p>
                    <div className="mt-4 flex items-center justify-between text-xs text-ink/50">
                      {president ? <span>{president.title}: {president.name}</span> : <span />}
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> {club._count.members}
                      </span>
                    </div>
                  </Card>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      )}
    </div>
  );
}

function FilterChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`focus-ring rounded-full border px-4 py-1.5 text-sm transition-colors ${
        active ? "border-gold bg-gold/10 text-ink" : "border-ink/15 text-ink/50 hover:border-ink/35"
      }`}
    >
      {children}
    </button>
  );
}
