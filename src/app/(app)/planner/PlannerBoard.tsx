"use client";

import { useEffect, useState } from "react";
import { Plus, Star, Trash2, Download } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { MAJOR_NAMES, tracksForMajor } from "@/lib/major-requirements";
import { findRequirementCategoryForCode } from "@/lib/planner-progress";
import { isLanguageCourse } from "@/lib/planner-language";
import { RequirementsSidebar } from "@/components/planner/RequirementsSidebar";
import { AddCourseModal, type NewCourseInput, type EditingCourse } from "@/components/planner/AddCourseModal";
import { NewPlanModal } from "@/components/planner/NewPlanModal";
import {
  CATEGORY_COLORS,
  DEFAULT_CHIP_COLOR,
  LANGUAGE_CHIP_COLOR,
  type ApiPlan,
  type ApiPlannedCourse,
} from "@/components/planner/planner-types";

type SlotKey = { year: number; semester: "FALL" | "SPRING"; session: ApiPlannedCourse["session"] };

const YEARS = [1, 2, 3, 4];
const SEMESTERS: ("FALL" | "SPRING")[] = ["FALL", "SPRING"];

function slotSessions(semester: "FALL" | "SPRING"): ApiPlannedCourse["session"][] {
  return semester === "FALL" ? ["SESSION_1", "SESSION_2", "FULL"] : ["SESSION_1", "MINI_TERM", "SESSION_2", "FULL"];
}

function sessionLabelKey(session: ApiPlannedCourse["session"]): string {
  switch (session) {
    case "SESSION_1":
      return "session1";
    case "SESSION_2":
      return "session2";
    case "MINI_TERM":
      return "miniTerm";
    case "FULL":
      return "fullSession";
  }
}

export function PlannerBoard() {
  const t = useT("planner");
  const [plans, setPlans] = useState<ApiPlan[] | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [modalSlot, setModalSlot] = useState<SlotKey | null>(null);
  const [editingCourse, setEditingCourse] = useState<{ slot: SlotKey; course: EditingCourse } | null>(null);
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch("/api/planner/plans")
      .then((r) => r.json())
      .then((data: { plans: ApiPlan[] }) => {
        setPlans(data.plans);
        setSelectedPlanId((prev) => prev ?? data.plans[0]?.id ?? null);
      });
  }, []);

  const selectedPlan = plans?.find((p) => p.id === selectedPlanId) ?? null;

  const updatePlanInState = (plan: ApiPlan) => {
    setPlans((prev) => (prev ? prev.map((p) => (p.id === plan.id ? plan : p)) : prev));
  };

  const createPlan = async (name: string) => {
    const res = await fetch("/api/planner/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) return;
    const { plan } = await res.json();
    setPlans((prev) => [...(prev ?? []), plan]);
    setSelectedPlanId(plan.id);
    setShowNewPlanModal(false);
  };

  const patchPlan = async (data: Partial<Pick<ApiPlan, "major" | "track" | "isPrimary" | "name">>) => {
    if (!selectedPlan) return;
    const res = await fetch(`/api/planner/plans/${selectedPlan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return;
    const { plan } = await res.json();
    if (data.isPrimary) {
      setPlans((prev) => (prev ? prev.map((p) => ({ ...p, isPrimary: p.id === plan.id })) : prev));
    } else {
      updatePlanInState(plan);
    }
  };

  const deletePlan = async () => {
    if (!selectedPlan) return;
    if (!window.confirm(t("confirmDeletePlan"))) return;
    const res = await fetch(`/api/planner/plans/${selectedPlan.id}`, { method: "DELETE" });
    if (!res.ok) return;
    setPlans((prev) => {
      const next = (prev ?? []).filter((p) => p.id !== selectedPlan.id);
      setSelectedPlanId(next[0]?.id ?? null);
      return next;
    });
  };

  const addCourse = async (input: NewCourseInput) => {
    if (!selectedPlan || !modalSlot) return;
    const res = await fetch(`/api/planner/plans/${selectedPlan.id}/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...modalSlot, ...input }),
    });
    if (!res.ok) return;
    const { course } = await res.json();
    updatePlanInState({ ...selectedPlan, courses: [...selectedPlan.courses, course] });
    setModalSlot(null);
  };

  const saveEditedCourse = async (input: NewCourseInput) => {
    if (!selectedPlan || !editingCourse) return;
    const res = await fetch(`/api/planner/plans/${selectedPlan.id}/courses/${editingCourse.course.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) return;
    const { course } = await res.json();
    updatePlanInState({
      ...selectedPlan,
      courses: selectedPlan.courses.map((c) => (c.id === course.id ? course : c)),
    });
    setEditingCourse(null);
  };

  const removeCourse = async (courseId: string) => {
    if (!selectedPlan) return;
    const res = await fetch(`/api/planner/plans/${selectedPlan.id}/courses/${courseId}`, { method: "DELETE" });
    if (!res.ok) return;
    updatePlanInState({ ...selectedPlan, courses: selectedPlan.courses.filter((c) => c.id !== courseId) });
    setEditingCourse(null);
  };

  const exportPlan = async () => {
    if (!selectedPlan) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/planner/plans/${selectedPlan.id}/export`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedPlan.name.replace(/[^a-z0-9]+/gi, "-")}-four-year-plan.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const tracks = selectedPlan?.major ? tracksForMajor(selectedPlan.major) : [];

  if (plans === null) return null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {plans.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPlanId(p.id)}
            className={`focus-ring flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm ${
              p.id === selectedPlanId ? "border-gold bg-gold/20 text-ink" : "border-ink/15 text-ink/60"
            }`}
          >
            {p.isPrimary ? <Star className="h-3.5 w-3.5 fill-gold-bright text-gold-bright" /> : null}
            {p.name}
          </button>
        ))}
        <button
          onClick={() => setShowNewPlanModal(true)}
          className="focus-ring flex items-center gap-1 rounded-full border border-dashed border-ink/25 px-4 py-2 text-sm text-ink/55 hover:border-ink/45"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("newPlanButton")}
        </button>
      </div>

      {selectedPlan ? (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedPlan.major ?? ""}
                onChange={(e) => patchPlan({ major: e.target.value || null, track: null })}
                className="focus-ring rounded-xl border border-ink/15 bg-paper-dim px-3 py-2 text-sm"
              >
                <option value="">{t("selectMajor")}</option>
                {MAJOR_NAMES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              {selectedPlan.major && tracks.length > 0 ? (
                <select
                  value={selectedPlan.track ?? ""}
                  onChange={(e) => patchPlan({ track: e.target.value || null })}
                  className="focus-ring rounded-xl border border-ink/15 bg-paper-dim px-3 py-2 text-sm"
                >
                  <option value="">{t("noTrack")}</option>
                  {tracks
                    .filter((track): track is string => track !== null)
                    .map((track) => (
                      <option key={track} value={track}>
                        {track}
                      </option>
                    ))}
                </select>
              ) : null}

              <div className="ml-auto flex items-center gap-2">
                {!selectedPlan.isPrimary ? (
                  <button
                    onClick={() => patchPlan({ isPrimary: true })}
                    className="focus-ring rounded-full border border-ink/15 px-3 py-2 text-xs text-ink/60 hover:border-ink/40"
                  >
                    {t("makePrimary")}
                  </button>
                ) : null}
                <button
                  onClick={exportPlan}
                  disabled={exporting}
                  className="focus-ring flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-xs font-medium text-ink hover:bg-gold-bright disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  {exporting ? t("exporting") : t("exportButton")}
                </button>
                {plans.length > 1 ? (
                  <button
                    onClick={deletePlan}
                    className="focus-ring text-ink/30 hover:text-danger"
                    aria-label={t("deletePlan")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-6 space-y-6">
              {YEARS.map((year) => (
                <div key={year}>
                  <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-ink/45">{t("year", { n: year })}</h3>
                  <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {SEMESTERS.map((semester) => {
                      const semesterCourses = selectedPlan.courses.filter((c) => c.year === year && c.semester === semester);
                      const semesterCredits = semesterCourses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
                      return (
                        <div key={semester} className="rounded-lg border border-ink/10 p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-ink/80">{t(semester === "FALL" ? "fall" : "spring")}</p>
                            <span className="text-xs text-ink/45">{t("semesterCredits", { n: semesterCredits })}</span>
                          </div>
                          <div className="mt-2 space-y-2">
                            {slotSessions(semester).map((session) => {
                              const slotCourses = semesterCourses.filter((c) => c.session === session);
                              return (
                                <div key={session}>
                                  <p className="text-[10px] uppercase tracking-[0.14em] text-ink/40">{t(sessionLabelKey(session))}</p>
                                  <div className="mt-1 flex flex-wrap gap-1.5">
                                    {slotCourses.map((c) => {
                                      const category = findRequirementCategoryForCode(selectedPlan.major, selectedPlan.track, c.code);
                                      const color = category
                                        ? CATEGORY_COLORS[category]
                                        : isLanguageCourse(c.code)
                                          ? LANGUAGE_CHIP_COLOR
                                          : DEFAULT_CHIP_COLOR;
                                      return (
                                        <button
                                          key={c.id}
                                          type="button"
                                          title={c.title ?? undefined}
                                          onClick={() =>
                                            setEditingCourse({
                                              slot: { year, semester, session },
                                              course: {
                                                id: c.id,
                                                code: c.code,
                                                title: c.title ?? "",
                                                credits: c.credits ?? "",
                                                isCrNc: c.isCrNc,
                                                genEdTags: c.genEdTags,
                                              },
                                            })
                                          }
                                          className={`focus-ring rounded-full border px-2 py-1 text-[11px] font-medium transition-transform hover:-translate-y-0.5 ${color}`}
                                        >
                                          {c.code}
                                        </button>
                                      );
                                    })}
                                    <button
                                      onClick={() => setModalSlot({ year, semester, session })}
                                      aria-label={t("addCourse")}
                                      className="focus-ring flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-ink/25 text-ink/40 hover:border-ink/45"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <RequirementsSidebar major={selectedPlan.major} track={selectedPlan.track} courses={selectedPlan.courses} />
        </div>
      ) : null}

      {modalSlot && selectedPlan ? (
        <AddCourseModal
          major={selectedPlan.major}
          track={selectedPlan.track}
          placedCodes={selectedPlan.courses.map((c) => c.code)}
          onClose={() => setModalSlot(null)}
          onSave={addCourse}
        />
      ) : null}

      {editingCourse && selectedPlan ? (
        <AddCourseModal
          major={selectedPlan.major}
          track={selectedPlan.track}
          placedCodes={selectedPlan.courses.map((c) => c.code)}
          editing={editingCourse.course}
          onClose={() => setEditingCourse(null)}
          onSave={saveEditedCourse}
          onDelete={() => removeCourse(editingCourse.course.id)}
        />
      ) : null}

      {showNewPlanModal ? <NewPlanModal onClose={() => setShowNewPlanModal(false)} onCreate={createPlan} /> : null}
    </div>
  );
}
