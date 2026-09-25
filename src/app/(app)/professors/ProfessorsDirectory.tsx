"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleAlert, ShieldCheck, Smile, Star, Trash2 } from "lucide-react";
import { StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";
import { DKU_DEPARTMENTS } from "@/lib/departments";

type ApiProfessor = {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  verified: boolean;
  addedById: string;
  reviews: { gradingRating: number; funRating: number; teachingRating: number }[];
};

// No blended average — grading/teaching/fun are different questions, and
// mashing them into one number hides which one is actually driving it.
function averages(p: ApiProfessor) {
  if (!p.reviews.length) return null;
  const n = p.reviews.length;
  return {
    grading: p.reviews.reduce((s, r) => s + r.gradingRating, 0) / n,
    teaching: p.reviews.reduce((s, r) => s + r.teachingRating, 0) / n,
    fun: p.reviews.reduce((s, r) => s + r.funRating, 0) / n,
  };
}

export function ProfessorsDirectory({
  currentUserId,
  isAdmin = false,
}: {
  currentUserId: string | null;
  isAdmin?: boolean;
}) {
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
    if (!window.confirm("Remove this professor?")) return;
    const res = await fetch(`/api/professors/${id}`, { method: "DELETE" });
    if (res.ok) setProfessors((prev) => (prev ? prev.filter((p) => p.id !== id) : prev));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or department…"
          className="focus-ring w-full max-w-md flex-1 rounded-xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink placeholder:text-ink/30 focus:border-gold"
        />
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="focus-ring rounded-xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink focus:border-gold"
        >
          <option value="ALL">All departments</option>
          {DKU_DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {professors === null ? (
        <p className="mt-10 text-sm text-ink/40">Loading professors…</p>
      ) : professors.length === 0 ? (
        <p className="mt-10 text-ink/50">No professors yet. Add the first one.</p>
      ) : (
        <StaggerGroup className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {professors.map((p) => {
            const avg = averages(p);
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
                        aria-label="Remove professor"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                  <Link href={`/professors/${p.id}`} className="focus-ring mt-3 block">
                    <h3 className="flex items-center gap-1.5 font-display text-2xl">
                      {p.firstName} {p.lastName}
                      {p.verified ? <ShieldCheck className="h-4 w-4 text-gold-bright" aria-label="Verified" /> : null}
                    </h3>
                  </Link>
                  <div className="mt-3 flex flex-1 items-end justify-between">
                    {avg ? (
                      <span className="flex items-center gap-2.5 text-xs text-ink/70">
                        <span className="flex items-center gap-1">
                          <CircleAlert className="h-3.5 w-3.5 text-danger" /> {avg.grading.toFixed(1)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-gold-bright text-gold-bright" /> {avg.teaching.toFixed(1)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Smile className="h-3.5 w-3.5 text-sprout-deep" /> {avg.fun.toFixed(1)}
                        </span>
                      </span>
                    ) : (
                      <span className="text-sm text-ink/40">No ratings yet</span>
                    )}
                    <span className="text-xs text-ink/40">
                      {p.reviews.length} rating{p.reviews.length === 1 ? "" : "s"}
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
