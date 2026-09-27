"use client";

import { useT } from "@/lib/i18n/client";
import {
  computeDegreeProgress,
  computeMajorProgress,
  resolveExclusiveGenEd,
  GEN_ED_TAG_LABELS,
  type PlannedCourseLike,
} from "@/lib/planner-progress";
import { CATEGORY_COLORS } from "./planner-types";

export function RequirementsSidebar({
  major,
  track,
  courses,
}: {
  major: string | null;
  track: string | null;
  courses: PlannedCourseLike[];
}) {
  const t = useT("planner");
  const majorProgress = computeMajorProgress(major, track, courses);
  const distribution = resolveExclusiveGenEd(courses);
  const degree = computeDegreeProgress(courses);

  return (
    <div className="space-y-6 rounded-lg border border-ink/10 bg-paper p-5">
      <div>
        <h3 className="font-display text-lg">{t("sidebarDegreeProgress")}</h3>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-paper-dim">
          <div className="h-full rounded-full bg-gold" style={{ width: `${degree.percent}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-ink/55">
          {t("creditsTowardGraduation", { done: degree.totalCredits, total: degree.creditsNeeded })}
        </p>
        <dl className="mt-3 space-y-1 text-xs text-ink/55">
          <div className="flex justify-between">
            <dt>{t("languageCreditsLabel")}</dt>
            <dd>{degree.languageCredits}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{t("crnCapLabel")}</dt>
            <dd>
              {degree.crnCredits} / {degree.crnCap}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>{t("dukeFacultyLabel")}</dt>
            <dd>
              {degree.dukeFacultyCredits} / {degree.dukeFacultyCap}
            </dd>
          </div>
        </dl>
      </div>

      <div className="border-t border-ink/10 pt-5">
        <h3 className="font-display text-lg">{t("sidebarMajorProgress")}</h3>
        {!majorProgress ? (
          <p className="mt-2 text-xs text-ink/45">{t("sidebarNoMajor")}</p>
        ) : (
          <div className="mt-3 space-y-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-paper-dim">
              <div className="h-full rounded-full bg-sprout" style={{ width: `${majorProgress.percent}%` }} />
            </div>
            {Object.entries(majorProgress.categories).map(([category, data]) => (
              <div key={category}>
                <div className="flex items-center justify-between text-xs font-medium text-ink/70">
                  <span className={`rounded-full border px-2 py-0.5 ${CATEGORY_COLORS[category] ?? ""}`}>
                    {t(`category_${category}`)}
                  </span>
                  <span>
                    {data.met}/{data.total}
                  </span>
                </div>
                <ul className="mt-1.5 space-y-0.5 text-[11px] text-ink/50">
                  {data.units.map((u, i) => (
                    <li key={i} className={u.satisfiedBy ? "text-sprout-deep line-through" : ""}>
                      {u.label}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {courses.some((c) => c.genEdTags.length > 0) ? (
        <div className="border-t border-ink/10 pt-5">
          <ul className="space-y-1 text-xs text-ink/55">
            {(["DISTRIBUTION_NAS", "DISTRIBUTION_SS", "DISTRIBUTION_ARHU", "QUANTITATIVE_REASONING"] as const).map((tag) => {
              const courseId = distribution.slotAssignment[tag];
              const course = courseId ? courses.find((c) => c.id === courseId) : null;
              return (
                <li key={tag} className="flex justify-between">
                  <span>{GEN_ED_TAG_LABELS[tag]}</span>
                  <span className={course ? "text-sprout-deep" : "text-ink/30"}>{course ? course.code : "—"}</span>
                </li>
              );
            })}
            {(["COMMON_CORE_Y1", "COMMON_CORE_Y2", "COMMON_CORE_Y3", "WRITING", "DUKE_FACULTY"] as const).map((tag) => {
              const count = courses.filter((c) => c.genEdTags.includes(tag)).length;
              if (count === 0) return null;
              return (
                <li key={tag} className="flex justify-between">
                  <span>{GEN_ED_TAG_LABELS[tag]}</span>
                  <span>{count}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
