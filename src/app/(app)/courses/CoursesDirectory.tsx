"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Trash2 } from "lucide-react";
import { StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { Card } from "@/components/ui/Card";

type ApiCourse = {
  id: string;
  code: string;
  title: string;
  department: string;
  description: string | null;
  createdById: string;
  offerings: { professor: { id: string; firstName: string; lastName: string } }[];
  _count: { resources: number };
};

export function CoursesDirectory({
  currentUserId,
  isAdmin = false,
}: {
  currentUserId: string | null;
  isAdmin?: boolean;
}) {
  const [courses, setCourses] = useState<ApiCourse[] | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    const qs = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
    const handle = setTimeout(() => {
      fetch(`/api/courses${qs}`)
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled) setCourses(data.courses ?? []);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [q]);

  const remove = async (id: string) => {
    if (!window.confirm("Remove this course?")) return;
    const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
    if (res.ok) setCourses((prev) => (prev ? prev.filter((c) => c.id !== id) : prev));
  };

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by code, title, or department…"
        className="focus-ring w-full max-w-md rounded-xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink placeholder:text-ink/30 focus:border-gold"
      />

      {courses === null ? (
        <p className="mt-10 text-sm text-ink/40">Loading courses…</p>
      ) : courses.length === 0 ? (
        <p className="mt-10 text-ink/50">No courses yet. Add the first one.</p>
      ) : (
        <StaggerGroup className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <StaggerItem key={course.id}>
              <Card className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-2">
                  <span className="w-fit rounded-full bg-sprout/25 px-2.5 py-0.5 text-xs font-medium text-sprout-deep">
                    {course.department}
                  </span>
                  {isAdmin || course.createdById === currentUserId ? (
                    <button
                      onClick={() => remove(course.id)}
                      className="focus-ring text-ink/30 transition-colors hover:text-danger"
                      aria-label="Remove course"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
                <Link href={`/courses/${course.id}`} className="focus-ring mt-3 block">
                  <p className="text-xs uppercase tracking-[0.15em] text-ink/45">{course.code}</p>
                  <h3 className="mt-1 font-display text-2xl">{course.title}</h3>
                </Link>
                {course.description ? <p className="mt-1.5 flex-1 text-sm text-ink/65">{course.description}</p> : <div className="flex-1" />}
                <div className="mt-4 flex items-center justify-between text-xs text-ink/45">
                  <span>
                    {course.offerings.length
                      ? course.offerings
                          .map((o) => `${o.professor.firstName} ${o.professor.lastName}`)
                          .filter((v, i, a) => a.indexOf(v) === i)
                          .join(", ")
                      : "No professor listed"}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> {course._count.resources}
                  </span>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </div>
  );
}
