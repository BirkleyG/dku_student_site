import { Reveal } from "@/components/motion/Reveal";

export function ComingSoon({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl py-12 text-center">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.3em] text-gold">{eyebrow}</p>
        <h1 className="mt-2 font-display text-4xl font-medium">{title}</h1>
        <p className="mx-auto mt-4 max-w-md text-paper/60">{description}</p>
      </Reveal>
      {children ? (
        <Reveal delay={0.1} className="mt-8">
          {children}
        </Reveal>
      ) : null}
      <Reveal delay={0.15} className="mt-10 inline-block rounded-full border border-paper/15 px-4 py-1.5 text-xs text-paper/40">
        Building this next ✦
      </Reveal>
    </div>
  );
}
