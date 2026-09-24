"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { courseSchema, type CourseInput } from "@/lib/course-validation";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

type ProfessorOption = { id: string; firstName: string; lastName: string; department: string };

export function NewCourseForm({ professors }: { professors: ProfessorOption[] }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [addingNewProfessor, setAddingNewProfessor] = useState(professors.length === 0);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CourseInput>({ resolver: zodResolver(courseSchema) });

  const onSubmit = async (data: CourseInput) => {
    setServerError(null);
    const res = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setServerError(body.error ?? "Couldn't add that course.");
      return;
    }

    const { course } = await res.json();
    router.push(`/courses/${course.id}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Course code" placeholder="COMPSCI 201" {...register("code")} error={errors.code?.message} />
        <Field label="Department" placeholder="Computer Science" {...register("department")} error={errors.department?.message} />
      </div>

      <Field label="Title" placeholder="Data Structures" {...register("title")} error={errors.title?.message} />

      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-ink/60">Description (optional)</span>
        <textarea
          rows={3}
          className="focus-ring w-full rounded-xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink placeholder:text-ink/30 focus:border-gold"
          {...register("description")}
        />
      </label>

      <div className="rounded-2xl border border-ink/10 bg-paper-dim/60 p-4">
        <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-ink/60">Professor (optional)</span>

        {professors.length > 0 && !addingNewProfessor ? (
          <>
            <select
              className="focus-ring w-full rounded-xl border border-ink/15 bg-paper px-4 py-3 text-ink focus:border-gold"
              {...register("professorId")}
            >
              <option value="">No professor yet</option>
              {professors.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} — {p.department}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setAddingNewProfessor(true)}
              className="focus-ring mt-2 text-xs text-ink/50 underline decoration-ink/25 underline-offset-2 hover:text-ink"
            >
              Their name isn&apos;t listed — add a new professor
            </button>
          </>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name" {...register("newProfessorFirstName")} />
              <Field label="Last name" {...register("newProfessorLastName")} />
            </div>
            <Field label="Their department" placeholder="Defaults to course department" {...register("newProfessorDepartment")} />
            {professors.length > 0 ? (
              <button
                type="button"
                onClick={() => setAddingNewProfessor(false)}
                className="focus-ring text-xs text-ink/50 underline decoration-ink/25 underline-offset-2 hover:text-ink"
              >
                Pick an existing professor instead
              </button>
            ) : null}
          </div>
        )}

        <div className="mt-3">
          <Field label="Semester taught (optional)" placeholder="Fall 2025" {...register("semester")} />
        </div>
      </div>

      {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Adding…" : "Add course"}
      </Button>
    </form>
  );
}
