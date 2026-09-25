"use client";

const TERMS = ["Fall", "Spring", "Summer Session 1", "Summer Session 2"] as const;

/** Splits a "Term Year" string (e.g. "Fall 2026") into its parts. Empty input means no term picked yet. */
function parseSemester(value: string): { term: (typeof TERMS)[number] | ""; year: string } {
  const match = value.trim().match(/^(Fall|Spring|Summer Session 1|Summer Session 2)\s*(\d{0,4})$/);
  if (match) return { term: match[1] as (typeof TERMS)[number], year: match[2] };
  return { term: "", year: "" };
}

/** Term dropdown (Fall/Spring/Summer Session 1-2) + free-text year, serialized as "Term Year". */
export function SemesterPicker({
  value,
  onChange,
  className = "",
  optionalLabel = "No specific semester",
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  optionalLabel?: string;
}) {
  const { term, year } = parseSemester(value);

  const emit = (nextTerm: string, nextYear: string) => {
    if (!nextTerm) {
      onChange("");
      return;
    }
    onChange(nextYear ? `${nextTerm} ${nextYear}` : nextTerm);
  };

  return (
    <div className={`flex gap-3 ${className}`}>
      <select
        value={term}
        onChange={(e) => emit(e.target.value, year)}
        className="focus-ring flex-1 rounded-xl border border-ink/15 bg-paper px-4 py-3 text-ink focus:border-gold"
      >
        <option value="">{optionalLabel}</option>
        {TERMS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      {term ? (
        <input
          value={year}
          onChange={(e) => emit(term, e.target.value.replace(/\D/g, "").slice(0, 4))}
          inputMode="numeric"
          placeholder="Year"
          className="focus-ring w-24 rounded-xl border border-ink/15 bg-paper px-4 py-3 text-ink placeholder:text-ink/30 focus:border-gold"
        />
      ) : null}
    </div>
  );
}
