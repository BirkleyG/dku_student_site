"use client";

import { useEffect, useState } from "react";
import { Mail, Trash2 } from "lucide-react";
import { StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import { clubCategories, clubCategoryLabels } from "@/lib/club-validation";

type ApiClub = {
  id: string;
  name: string;
  category: (typeof clubCategories)[number];
  description: string;
  contact: string | null;
  submittedById: string;
};

export function ClubsDirectory({
  currentUserId,
  isAdmin = false,
}: {
  currentUserId: string | null;
  isAdmin?: boolean;
}) {
  const [clubs, setClubs] = useState<ApiClub[] | null>(null);
  const [category, setCategory] = useState<(typeof clubCategories)[number] | "ALL">("ALL");

  useEffect(() => {
    let cancelled = false;
    const qs = category === "ALL" ? "" : `?category=${category}`;
    fetch(`/api/clubs${qs}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setClubs(data.clubs ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [category]);

  const remove = async (id: string) => {
    if (!window.confirm("Remove this club?")) return;
    const res = await fetch(`/api/clubs/${id}`, { method: "DELETE" });
    if (res.ok) setClubs((prev) => (prev ? prev.filter((c) => c.id !== id) : prev));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip active={category === "ALL"} onClick={() => setCategory("ALL")}>
          All
        </FilterChip>
        {clubCategories.map((c) => (
          <FilterChip key={c} active={category === c} onClick={() => setCategory(c)}>
            {clubCategoryLabels[c]}
          </FilterChip>
        ))}
      </div>

      {clubs === null ? (
        <p className="mt-10 text-sm text-ink/40">Loading clubs…</p>
      ) : clubs.length === 0 ? (
        <p className="mt-10 text-ink/50">No clubs in this category yet. Add the first one.</p>
      ) : (
        <StaggerGroup className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => (
            <StaggerItem key={club.id}>
              <Card className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-2">
                  <span className="w-fit rounded-full bg-sprout/25 px-2.5 py-0.5 text-xs font-medium text-sprout-deep">
                    {clubCategoryLabels[club.category]}
                  </span>
                  {isAdmin || club.submittedById === currentUserId ? (
                    <button
                      onClick={() => remove(club.id)}
                      className="focus-ring text-ink/30 transition-colors hover:text-danger"
                      aria-label="Remove club"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
                <h3 className="mt-3 font-display text-2xl">{club.name}</h3>
                <p className="mt-1.5 flex-1 text-sm text-ink/65">{club.description}</p>
                {club.contact ? (
                  <p className="mt-4 flex items-center gap-1.5 text-xs text-ink/50">
                    <Mail className="h-3.5 w-3.5" /> {club.contact}
                  </p>
                ) : null}
              </Card>
            </StaggerItem>
          ))}
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
