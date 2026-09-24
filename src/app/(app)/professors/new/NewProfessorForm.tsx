"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { professorSchema, type ProfessorInput } from "@/lib/professor-validation";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function NewProfessorForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfessorInput>({ resolver: zodResolver(professorSchema) });

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
      <Field label="Department" placeholder="Computer Science" {...register("department")} error={errors.department?.message} />
      <Field label="Email (optional)" placeholder="name@dukekunshan.edu.cn" {...register("email")} error={errors.email?.message} />

      {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Adding…" : "Add professor"}
      </Button>
    </form>
  );
}
