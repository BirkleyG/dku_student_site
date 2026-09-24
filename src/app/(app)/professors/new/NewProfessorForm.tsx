"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { professorSchema, type ProfessorInput } from "@/lib/professor-validation";
import { DKU_DEPARTMENTS } from "@/lib/departments";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function NewProfessorForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProfessorInput>({ resolver: zodResolver(professorSchema), defaultValues: { department: DKU_DEPARTMENTS[0] } });

  const department = useWatch({ control, name: "department" });

  const onSubmit = async (data: ProfessorInput) => {
    setServerError(null);
    const res = await fetch("/api/professors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setServerError(body.error ?? "Couldn't add that professor.");
      return;
    }

    const { professor } = await res.json();
    router.push(`/professors/${professor.id}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="First name" {...register("firstName")} error={errors.firstName?.message} />
        <Field label="Last name" {...register("lastName")} error={errors.lastName?.message} />
      </div>

      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.15em] text-ink/60">Department</span>
        <select
          className="focus-ring w-full rounded-xl border border-ink/15 bg-paper-dim px-4 py-3 text-ink focus:border-gold"
          {...register("department")}
        >
          {DKU_DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>

      {department === "Other" ? (
        <Field
          label="Which department?"
          placeholder="Type it in — we'll add it to the list next update"
          {...register("otherDepartment")}
          error={errors.otherDepartment?.message}
        />
      ) : null}

      <Field label="Email (optional)" placeholder="name@dukekunshan.edu.cn" {...register("email")} error={errors.email?.message} />

      {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Adding…" : "Add professor"}
      </Button>
    </form>
  );
}
