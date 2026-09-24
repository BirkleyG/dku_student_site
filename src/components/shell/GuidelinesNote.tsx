import Link from "next/link";

export function GuidelinesNote() {
  return (
    <p className="mt-4 text-center text-xs text-ink/35">
      Keep it something your classmates would want to run into. See the{" "}
      <Link href="/terms" className="underline decoration-ink/30 underline-offset-2 hover:text-ink">
        community guidelines
      </Link>
      .
    </p>
  );
}
