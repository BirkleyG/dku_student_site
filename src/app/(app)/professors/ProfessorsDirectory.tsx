"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, ShieldCheck, Trash2 } from "lucide-react";
import { StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import { DKU_DEPARTMENTS } from "@/lib/departments";
import { useT } from "@/lib/i18n/client";

type ApiProfessor = {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  verified: boolean;
  addedById: string;
  reviews: { gradingRating: number; difficultyRating: number; teachingRating: number }[];
};

function overallScore(p: ApiProfessor) {
  if (!p.reviews.length) return null;
  const avg = p.reviews.reduce((sum, r) => sum + r.gradingRating + r.difficultyRating + r.teachingRating, 0) / (p.reviews.length * 3);
  return avg;
}

export function ProfessorsDirectory({
  currentUserId,
  isAdmin = false,
}: {
  currentUserId: string | null;
  isAdmin?: boolean;
}) {
  const t = useT("professors");
  const [professors, setProfessors] = useState<ApiProfessor[] | null>(null);
  const [q, setQ] = useState("");
  const [department, setDepartment] = useState<string | "ALL">("ALL");

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (department !== "ALL") params.set("department", department);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const handle = setTimeout(() => {
      fetch(`/api/professors${qs}`)
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled) setProfessors(data.professors ?? []);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [q, department]);

  const remove = async (id: string) => {
    if (!window.confirm(t("confirmRemoveProfessor"))) return;
    const res = await fetch(`/api/professors/${id}`, { method: "DELETE" });
    if (res.ok) setProfessors((prev) => (prev ? prev.filter((p) => p.id !== id) : prev));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="focus-ring w-full max-w-md flex-1 rounded-xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink placeholder:text-ink/30 focus:border-gold"
        />
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="focus-ring rounded-xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink focus:border-gold"
        >
          <option value="ALL">{t("allDepartments")}</option>
          {DKU_DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {professors === null ? (
        <p className="mt-10 text-sm text-ink/40">{t("loadingProfessors")}</p>
      ) : professors.length === 0 ? (
        <p className="mt-10 text-ink/50">{t("emptyState")}</p>
      ) : (
        <StaggerGroup className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {professors.map((p) => {
            const score = overallScore(p);
            return (
              <StaggerItem key={p.id}>
                <Card className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <span className="w-fit rounded-full bg-sprout/25 px-2.5 py-0.5 text-xs font-medium text-sprout-deep">
                      {p.department}
                    </span>
                    {isAdmin || p.addedById === currentUserId ? (
                      <button
                        onClick={() => remove(p.id)}
                        className="focus-ring text-ink/30 transition-colors hover:text-danger"
                        aria-label={t("removeProfessorAria")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                  <Link href={`/professors/${p.id}`} className="focus-ring mt-3 block">
                    <h3 className="flex items-center gap-1.5 font-display text-2xl">
                      {p.firstName} {p.lastName}
                      {p.verified ? <ShieldCheck className="h-4 w-4 text-gold-bright" aria-label={t("verifiedAria")} /> : null}
                    </h3>
                  </Link>
                  <div className="mt-3 flex flex-1 items-end justify-between">
                    {score !== null ? (
                      <span className="flex items-center gap-1 text-sm text-ink/70">
                        <Star className="h-4 w-4 fill-gold-bright text-gold-bright" /> {score.toFixed(1)} / 5
                      </span>
                    ) : (
                      <span className="text-sm text-ink/40">{t("noRatingsYetShort")}</span>
                    )}
                    <span className="text-xs text-ink/40">
                      {p.reviews.length === 1
                        ? t("ratingsCountOne", { n: p.reviews.length })
                        : t("ratingsCountOther", { n: p.reviews.length })}
                    </span>
                  </div>
                </Card>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      )}
    </div>
  );
}
